import { createClient } from "@/lib/supabase/client"
import { PLANS, type PlanTier } from "@/core/billing/plans"
import { TENANTS_CONFIG, type TenantConfig } from "@/config/tenants"

// ============================================================================
// TYPES
// ============================================================================

export interface TenantQuotaStatus {
  tenantId: string
  tenantName: string
  plan: PlanTier
  resource: "maxInventoryItems" | "maxCustomers" | "maxUsers"
  currentUsage: number
  limit: number
  percentUsed: number
  status: "ok" | "warning" | "exceeded"
}

export interface PlanDistribution {
  plan: PlanTier
  planName: string
  count: number
  percentage: number
}

export interface GlobalMetrics {
  totalTenants: number
  totalActiveTenants: number
  totalInventoryItems: number
  totalCustomers: number
  totalUsers: number
  tenantsNearLimit: number
  tenantsExceeded: number
}

export interface TopConsumer {
  tenantId: string
  tenantName: string
  plan: PlanTier
  usage: number
  limit: number
  percentUsed: number
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * SaaS Metrics Service
 * Servicio de solo lectura para obtener métricas agregadas del SaaS.
 * Fuente de verdad para el Dashboard Ejecutivo SuperAdmin.
 */
export class SaasMetricsService {
  private supabase = createClient()

  /**
   * Obtiene todas las métricas globales
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    const tenants = await this.fetchRealTenants()
    const quotaData = await this.getQuotaData()

    // Calcular totales
    let totalInventory = 0
    let totalCustomers = 0
    let totalUsers = 0

    const criticalTenantsSet = new Set<string>()
    const exceededTenantsSet = new Set<string>()

    for (const tenant of tenants) {
      const tenantQuotas = quotaData.filter(q => q.tenant_id === tenant.id)
      const plan = PLANS[tenant.plan as PlanTier]

      for (const quota of tenantQuotas) {
        const resourceKey = quota.resource_key as keyof typeof plan.quotas
        const limit = plan?.quotas?.[resourceKey] ?? 0
        const usage = quota.current_usage || 0

        // Acumular totales
        if (resourceKey === "maxInventoryItems") totalInventory += usage
        if (resourceKey === "maxCustomers") totalCustomers += usage
        if (resourceKey === "maxUsers") totalUsers += usage

        // Calcular estado por tenant único
        if (limit > 0) {
          const percent = (usage / limit) * 100
          if (percent >= 100) {
            exceededTenantsSet.add(tenant.id)
            criticalTenantsSet.delete(tenant.id)
          } else if (percent >= 80) {
            if (!exceededTenantsSet.has(tenant.id)) {
              criticalTenantsSet.add(tenant.id)
            }
          }
        }
      }
    }

    return {
      totalTenants: tenants.length,
      totalActiveTenants: tenants.filter(t => t.isActive).length,
      totalInventoryItems: totalInventory,
      totalCustomers: totalCustomers,
      totalUsers: totalUsers,
      tenantsNearLimit: criticalTenantsSet.size,
      tenantsExceeded: exceededTenantsSet.size,
    }
  }

  /**
   * Obtiene tenants con quotas críticas (>80% o exceeded)
   */
  async getCriticalQuotaTenants(): Promise<TenantQuotaStatus[]> {
    const tenants = await this.fetchRealTenants()
    const quotaData = await this.getQuotaData()
    const critical: TenantQuotaStatus[] = []

    for (const tenant of tenants) {
      const plan = PLANS[tenant.plan as PlanTier]
      const tenantQuotas = quotaData.filter(q => q.tenant_id === tenant.id)

      for (const quota of tenantQuotas) {
        const resourceKey = quota.resource_key as keyof typeof plan.quotas
        const limit = plan?.quotas?.[resourceKey] ?? 0
        const usage = quota.current_usage || 0

        if (limit === 0) continue

        const percent = (usage / limit) * 100
        
        if (percent >= 80) {
          critical.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            plan: tenant.plan as PlanTier,
            resource: resourceKey as TenantQuotaStatus["resource"],
            currentUsage: usage,
            limit,
            percentUsed: Math.round(percent),
            status: percent >= 100 ? "exceeded" : "warning",
          })
        }
      }
    }

    return critical.sort((a, b) => b.percentUsed - a.percentUsed)
  }

  /**
   * Obtiene los top consumers por recurso
   */
  async getTopConsumers(resource: "maxInventoryItems" | "maxCustomers", limit = 5): Promise<TopConsumer[]> {
    const tenants = await this.fetchRealTenants()
    const quotaData = await this.getQuotaData()
    const consumers: TopConsumer[] = []

    for (const tenant of tenants) {
      const plan = PLANS[tenant.plan as PlanTier]
      const quota = quotaData.find(q => q.tenant_id === tenant.id && q.resource_key === resource)
      
      if (quota) {
        const planLimit = plan?.quotas?.[resource] ?? 0
        consumers.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          plan: tenant.plan as PlanTier,
          usage: quota.current_usage || 0,
          limit: planLimit,
          percentUsed: planLimit > 0 ? Math.round((quota.current_usage / planLimit) * 100) : 0,
        })
      }
    }

    return consumers
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit)
  }

  /**
   * Obtiene la distribución de tenants por plan
   */
  async getPlanDistribution(): Promise<PlanDistribution[]> {
    const tenants = await this.fetchRealTenants()
    const planCounts: Record<PlanTier, number> = {
      free: 0, starter: 0, professional: 0, enterprise: 0,
    }

    const planNames: Record<PlanTier, string> = {
      free: "Free", starter: "Starter", professional: "Professional", enterprise: "Enterprise",
    }

    for (const tenant of tenants) {
      const plan = (tenant.plan as PlanTier) || 'free'
      if (planCounts[plan] !== undefined) planCounts[plan]++
    }

    const total = tenants.length || 1
    return Object.entries(planCounts).map(([plan, count]) => ({
      plan: plan as PlanTier,
      planName: planNames[plan as PlanTier],
      count,
      percentage: Math.round((count / total) * 100),
    }))
  }

  private async fetchRealTenants(): Promise<TenantConfig[]> {
    const { data, error } = await this.supabase
      .from("tenants")
      .select("*")
    
    if (error) {
      console.error("[SaasMetricsService] Error fetching real tenants:", error)
      return []
    }

    // Mapear de Snake Case (DB) a Camel Case (App Config) si es necesario
    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      plan: t.plan,
      industryType: t.industry_type,
      activeModules: t.active_modules || [],
      branding: t.branding || {},
      isActive: t.is_active ?? true,
      maxUsers: t.max_users,
      createdAt: t.created_at,
      customDomain: t.custom_domain,
      featureFlags: t.feature_flags || [],
    }))
  }

  private async getQuotaData(): Promise<Array<{
    tenant_id: string
    resource_key: string
    current_usage: number
    updated_at: string
  }>> {
    const { data, error } = await this.supabase
      .from("tenant_quotas")
      .select("tenant_id, resource_key, current_usage, updated_at")

    if (error) {
      console.error("[SaasMetricsService] Error fetching quotas:", error)
      return []
    }

    return data || []
  }
}

export const saasMetricsService = new SaasMetricsService()

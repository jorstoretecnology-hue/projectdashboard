import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
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

export class SaasMetricsService {
  /**
   * Obtiene el cliente de Supabase adecuado (Server o Client)
   */
  private async getSupabase() {
    if (typeof window === 'undefined') {
      return await createServerClient()
    }
    return createBrowserClient()
  }

  /**
   * Obtiene toda la data necesaria para el Dashboard en una sola pasada.
   * OPTIMIZACIÓN CRÍTICA: Reduce de ~10 queries a solo 2.
   */
  async getDashboardSnapshot() {
    const supabase = await this.getSupabase()
    
    // 1. Fetch de datos crudos en paralelo
    const [tenantsRes, quotasRes] = await Promise.all([
      supabase.from("tenants").select("id, name, plan, industry_type, active_modules, branding, is_active, max_users, created_at, updated_at, custom_domain, feature_flags"),
      supabase.from("tenant_quotas").select("tenant_id, resource_key, current_usage, updated_at")
    ])

    if (tenantsRes.error) throw tenantsRes.error
    if (quotasRes.error) throw quotasRes.error

    const rawTenants = tenantsRes.data || []
    const quotaData = quotasRes.data || []

    // 2. Mapear tenants a la configuración de la app
    const tenants: TenantConfig[] = rawTenants.map(t => ({
      id: t.id,
      name: t.name,
      plan: (t.plan as PlanTier) || 'free',
      industryType: t.industry_type,
      activeModules: t.active_modules || [],
      branding: t.branding || {},
      isActive: t.is_active ?? true,
      maxUsers: t.max_users,
      createdAt: t.created_at,
      customDomain: t.custom_domain,
      featureFlags: t.feature_flags || [],
    }))

    // 3. Calcular métricas en memoria (Zero DB calls here)
    
    // Global Metrics
    let totalInventory = 0
    let totalCustomers = 0
    let totalUsers = 0
    const criticalTenantsSet = new Set<string>()
    const exceededTenantsSet = new Set<string>()

    // Plan Distribution
    const planCounts: Record<PlanTier, number> = { free: 0, starter: 0, professional: 0, enterprise: 0 }
    
    // Top Consumers Lists
    const invConsumers: TopConsumer[] = []
    const custConsumers: TopConsumer[] = []
    
    // Critical Quota List
    const criticalList: TenantQuotaStatus[] = []

    for (const tenant of tenants) {
      // Plan counts
      if (planCounts[tenant.plan] !== undefined) planCounts[tenant.plan]++
      
      const plan = PLANS[tenant.plan]
      const tenantQuotas = quotaData.filter(q => q.tenant_id === tenant.id)

      for (const quota of tenantQuotas) {
        const resourceKey = quota.resource_key as keyof typeof plan.quotas
        const limit = plan?.quotas?.[resourceKey] ?? 0
        const usage = quota.current_usage || 0

        // Aggregates
        if (resourceKey === "maxInventoryItems") {
          totalInventory += usage
          invConsumers.push({
            tenantId: tenant.id, tenantName: tenant.name, plan: tenant.plan, usage, limit,
            percentUsed: limit > 0 ? Math.round((usage / limit) * 100) : 0
          })
        }
        if (resourceKey === "maxCustomers") {
          totalCustomers += usage
          custConsumers.push({
            tenantId: tenant.id, tenantName: tenant.name, plan: tenant.plan, usage, limit,
            percentUsed: limit > 0 ? Math.round((usage / limit) * 100) : 0
          })
        }
        if (resourceKey === "maxUsers") totalUsers += usage

        // Quota Status
        if (limit > 0) {
          const percent = (usage / limit) * 100
          if (percent >= 100) {
            exceededTenantsSet.add(tenant.id)
            criticalTenantsSet.delete(tenant.id)
          } else if (percent >= 80) {
            if (!exceededTenantsSet.has(tenant.id)) criticalTenantsSet.add(tenant.id)
          }

          if (percent >= 80) {
            criticalList.push({
              tenantId: tenant.id, tenantName: tenant.name, plan: tenant.plan,
              resource: resourceKey as TenantQuotaStatus["resource"],
              currentUsage: usage, limit, percentUsed: Math.round(percent),
              status: percent >= 100 ? "exceeded" : "warning"
            })
          }
        }
      }
    }

    const total = tenants.length || 1
    const planNames: Record<PlanTier, string> = { free: "Free", starter: "Starter", professional: "Professional", enterprise: "Enterprise" }

    return {
      global: {
        totalTenants: tenants.length,
        totalActiveTenants: tenants.filter(t => t.isActive).length,
        totalInventoryItems: totalInventory,
        totalCustomers: totalCustomers,
        totalUsers: totalUsers,
        tenantsNearLimit: criticalTenantsSet.size,
        tenantsExceeded: exceededTenantsSet.size,
      },
      critical: criticalList.sort((a, b) => b.percentUsed - a.percentUsed),
      plans: Object.entries(planCounts).map(([plan, count]) => ({
        plan: plan as PlanTier, planName: planNames[plan as PlanTier],
        count, percentage: Math.round((count / total) * 100)
      })),
      topInventory: invConsumers.sort((a, b) => b.usage - a.usage).slice(0, 5),
      topCustomers: custConsumers.sort((a, b) => b.usage - a.usage).slice(0, 5)
    }
  }

  /**
   * Métodos individuales (mantenidos por compatibilidad, pero optimizados)
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    return (await this.getDashboardSnapshot()).global
  }

  async getCriticalQuotaTenants(): Promise<TenantQuotaStatus[]> {
    return (await this.getDashboardSnapshot()).critical
  }

  async getTopConsumers(resource: "maxInventoryItems" | "maxCustomers", limit = 5): Promise<TopConsumer[]> {
    const data = await this.getDashboardSnapshot()
    return resource === "maxInventoryItems" ? data.topInventory : data.topCustomers
  }

  async getPlanDistribution(): Promise<PlanDistribution[]> {
    return (await this.getDashboardSnapshot()).plans
  }

  // Deprecated support for direct DB calls if needed (not recommended)
  private async fetchRealTenants(): Promise<TenantConfig[]> {
     const supabase = await this.getSupabase()
     const { data } = await supabase.from("tenants").select("id, name, plan")
     return (data || []).map(t => ({ id: t.id, name: t.name, plan: t.plan } as any))
  }

  private async getQuotaData(): Promise<any[]> {
    const supabase = await this.getSupabase()
    const { data } = await supabase.from("tenant_quotas").select("id, tenant_id, resource_key, current_usage, limit_override, updated_at")
    return data || []
  }
}

export const saasMetricsService = new SaasMetricsService()

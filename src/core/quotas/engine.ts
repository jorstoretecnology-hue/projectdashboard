import { createClient } from "@/lib/supabase/client"
import { PLANS, PlanTier } from "@/core/billing/plans"
import { tenantService } from "@/modules/tenants/services/tenant.service"
import { logger } from "@/lib/logger"

export type QuotaResource = "maxUsers" | "maxInventoryItems" | "maxCustomers"

export class QuotaEngine {
  private supabase = createClient()

  /**
   * Verifica si un tenant puede consumir una cantidad de recursos
   * @throws Error si se excede la quota
   */
  async assertCanConsume(tenantId: string, resource: QuotaResource, amount = 1): Promise<void> {
    // 1. Obtener Plan actual desde la DB (Real Data)
    const tenant = await tenantService.getTenantById(tenantId)
    if (!tenant) throw new Error("Tenant not found in database")
    
    const planTier = (tenant.plan as PlanTier) || "free"
    const planLimits = PLANS[planTier]

    // 2. Obtener Límite del Plan
    const limit = planLimits.quotas[resource]

    // 0 significa Ilimitado
    if (limit === 0) return

    // 3. Obtener Uso Actual (DB)
    const currentUsage = await this.getCurrentUsage(tenantId, resource)

    // 4. Verificar Quota
    if (currentUsage + amount > limit) {
      throw new Error(`QUOTA_EXCEEDED: Resource '${resource}' limit (${limit}) reached.`)
    }
  }

  /**
   * Incrementa el uso de un recurso de manera atómica
   */
  async incrementUsage(tenantId: string, resource: QuotaResource, amount = 1): Promise<void> {
    const { error } = await this.supabase.rpc('increment_tenant_quota', {
      p_tenant_id: tenantId,
      p_resource_key: resource as string,
      p_increment_by: amount
    })

    if (error) {
      logger.error("[QuotaEngine] Increment Error:", error)
      // No lanzamos error para no romper el flujo principal si el tracking falla,
      // pero logueamos crítico.
    }
  }

  /**
   * Decrementa el uso de un recurso de forma atómica (nunca menor a 0)
   */
  async decrementUsage(tenantId: string, resource: QuotaResource, amount = 1): Promise<void> {
    const { error } = await this.supabase.rpc('decrement_tenant_quota', {
      p_tenant_id: tenantId,
      p_resource_key: resource as string,
      p_decrement_by: amount
    })

    if (error) {
       logger.error("[QuotaEngine] Decrement Error:", error)
    }
  }

  /**
   * Obtiene el estado detallado de una quota (uso actual vs límite)
   */
  async getQuotaStatus(tenantId: string, resource: QuotaResource): Promise<{ current: number, limit: number, percentage: number }> {
    const tenant = await tenantService.getTenantById(tenantId)
    const planTier = (tenant?.plan as PlanTier) || "free"
    const limit = PLANS[planTier].quotas[resource]
    const current = await this.getCurrentUsage(tenantId, resource)
    
    return {
      current,
      limit,
      percentage: limit > 0 ? (current / limit) * 100 : 0
    }
  }

  /**
   * Obtiene el uso actual desde DB
   */
  private async getCurrentUsage(tenantId: string, resource: QuotaResource): Promise<number> {
    const { data, error } = await this.supabase
      .from("tenant_quotas")
      .select("current_usage")
      .eq("tenant_id", tenantId)
      .eq("resource_key", resource)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = Not found
       logger.error("[QuotaEngine] Read Usage Error", error)
    }

    return data?.current_usage || 0
  }
}

export const quotaEngine = new QuotaEngine()

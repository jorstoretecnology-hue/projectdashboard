import { createClient } from "@/lib/supabase/client"
import { quotaEngine } from "@/core/quotas/engine"

export interface TenantDashboardMetrics {
  inventoryUsage: number
  inventoryLimit: number
  customerUsage: number
  customerLimit: number
  activeUsers: number
  planStatus: string
}

/**
 * TenantDashboardService
 * -----------------------
 * Recupera métricas reales para el dashboard del cliente.
 */
class TenantDashboardService {
  private supabase = createClient()

  async getMetrics(tenantId: string): Promise<TenantDashboardMetrics> {
    // 1. Obtener Cuotas reales de la DB
    const [inventoryQuota, customerQuota] = await Promise.all([
      quotaEngine.getQuotaStatus(tenantId, 'maxInventoryItems'),
      quotaEngine.getQuotaStatus(tenantId, 'maxCustomers'),
    ])

    // 2. Obtener conteo de usuarios del tenant (simulado por ahora hasta tener tabla users completa)
    // En un sistema real sería: select count(*) from profiles where tenant_id = ...
    const { count: usersCount } = await this.supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    return {
      inventoryUsage: inventoryQuota.current,
      inventoryLimit: inventoryQuota.limit,
      customerUsage: customerQuota.current,
      customerLimit: customerQuota.limit,
      activeUsers: usersCount || 0,
      planStatus: 'Active'
    }
  }
}

export const tenantDashboardService = new TenantDashboardService()

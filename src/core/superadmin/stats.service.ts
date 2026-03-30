import { createClient } from "@/lib/supabase/client"
import type { QuotaResource } from "@/core/quotas/engine"

export interface TenantQuotaStats {
  tenantId: string
  inventoryItems: number
  customers: number
  users: number
  lastUpdated: string | null
}

/**
 * SuperAdmin Stats Service
 * Servicio de solo lectura para obtener métricas agregadas.
 * NO modifica el QuotaEngine ni los services existentes.
 */
export class SuperAdminStatsService {
  private supabase = createClient()

  /**
   * Obtiene las estadísticas de uso de todos los tenants.
   * Solo para SuperAdmin (no tiene RLS de tenant_id).
   */
  async getAllTenantsQuotaStats(): Promise<TenantQuotaStats[]> {
    const { data, error } = await this.supabase
      .from("tenant_quotas")
      .select("tenant_id, resource_key, current_usage, updated_at")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[SuperAdminStatsService] Error fetching quotas:", error)
      return []
    }

    // Agrupar por tenant_id
    const grouped = (data || []).reduce<Record<string, TenantQuotaStats>>((acc, row) => {
      const tid = row.tenant_id
      if (!acc[tid]) {
        acc[tid] = {
          tenantId: tid,
          inventoryItems: 0,
          customers: 0,
          users: 0,
          lastUpdated: null
        }
      }

      switch (row.resource_key as QuotaResource) {
        case "maxInventoryItems":
          acc[tid].inventoryItems = row.current_usage
          break
        case "maxCustomers":
          acc[tid].customers = row.current_usage
          break
        case "maxUsers":
          acc[tid].users = row.current_usage
          break
      }

      // Track most recent update
      if (row.updated_at && (!acc[tid].lastUpdated || row.updated_at > acc[tid].lastUpdated)) {
        acc[tid].lastUpdated = row.updated_at
      }

      return acc
    }, {})

    return Object.values(grouped)
  }

  /**
   * Obtiene estadísticas globales agregadas
   */
  async getGlobalStats(): Promise<{
    totalInventoryItems: number
    totalCustomers: number
    totalUsers: number
    tenantsWithData: number
  }> {
    const stats = await this.getAllTenantsQuotaStats()
    
    return {
      totalInventoryItems: stats.reduce((sum, t) => sum + t.inventoryItems, 0),
      totalCustomers: stats.reduce((sum, t) => sum + t.customers, 0),
      totalUsers: stats.reduce((sum, t) => sum + t.users, 0),
      tenantsWithData: stats.length
    }
  }
}

export const superAdminStatsService = new SuperAdminStatsService()

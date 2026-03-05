import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'PLAN_CHANGE' 
  | 'MODULE_TOGGLE' 
  | 'TENANT_SUSPEND'
  | 'TENANT_REACTIVATE'
  | 'ACCESS_DENIED'

export type AuditEntityType = 
  | 'INVENTORY' 
  | 'CUSTOMER' 
  | 'TENANT' 
  | 'USER' 
  | 'BILLING'
  | 'AUTH'
  | 'WEBHOOK_SUBSCRIPTION'

export interface AuditLogOptions {
  tenantId: string
  userId?: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  oldData?: any
  newData?: any
}

/**
 * AuditLogService
 * ---------------
 * Centraliza el registro de eventos Críticos para auditoría y seguridad.
 */
export class AuditLogService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Registra un evento en el log de auditoría.
   */
  async log(options: AuditLogOptions): Promise<void> {
    try {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side'
      
      const { error } = await this.supabase
        .from("audit_logs")
        .insert({
          tenant_id: options.tenantId,
          user_id: options.userId || null,
          action: options.action,
          entity_type: options.entityType,
          entity_id: options.entityId || null,
          old_data: options.oldData,
          new_data: options.newData,
          user_agent: userAgent,
        })

      if (error) {
        console.warn("[AuditLogService] Error al insertar log:", error.message)
      }
    } catch (err) {
      console.error("[AuditLogService] Critical Error:", err)
    }
  }

  // Helpers específicos facultativos
  
  async logPlanChange(tenantId: string, oldPlan: string, newPlan: string, adminId?: string) {
    return this.log({
      tenantId,
      userId: adminId,
      action: 'PLAN_CHANGE',
      entityType: 'BILLING',
      entityId: tenantId,
      oldData: { plan: oldPlan },
      newData: { plan: newPlan }
    })
  }

  async logResourceCreate(tenantId: string, entityType: AuditEntityType, entityId: string, data: any, userId?: string) {
    return this.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType,
      entityId,
      newData: data
    })
  }

  async logResourceUpdate(tenantId: string, entityType: AuditEntityType, entityId: string, data: any, userId?: string) {
    return this.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType,
      entityId,
      newData: data
    })
  }

  async logResourceDelete(tenantId: string, entityType: AuditEntityType, entityId: string, userId?: string) {
    return this.log({
      tenantId,
      userId,
      action: 'DELETE',
      entityType,
      entityId,
    })
  }
}

// Inyectar una instancia global por defecto para compatibilidad (usando browserClient si aplica)
// Pero se recomienda inyectar en Server Actions
import { createClient } from "@/lib/supabase/client"
export const auditLogService = new AuditLogService(createClient())

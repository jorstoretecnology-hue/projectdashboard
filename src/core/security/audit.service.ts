import { SupabaseClient } from "@supabase/supabase-js"
import { Database, Json } from "@/lib/supabase/database.types"
import { logger } from "@/lib/logger"

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
  oldData?: unknown
  newData?: unknown
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
          user_id: options.userId ?? null,
          action: options.action,
          entity_type: options.entityType,
          entity_id: options.entityId ?? null,
          old_data: options.oldData as Json,
          new_data: options.newData as Json,
          user_agent: userAgent,
          ip_address: null, // Campo requerido o opcional según tipo
        })

      if (error) {
        logger.warn("[AuditLogService] Error al insertar log:", error.message)
      }
    } catch (err) {
      logger.error("[AuditLogService] Critical Error:", { error: err })
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

  async logResourceCreate(tenantId: string, entityType: AuditEntityType, entityId: string, data: unknown, userId?: string) {
    return this.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType,
      entityId,
      newData: data
    })
  }

  async logResourceUpdate(tenantId: string, entityType: AuditEntityType, entityId: string, data: unknown, userId?: string) {
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

import { createClient } from '@/lib/supabase/client';
import type { PlanType } from '@/config/tenants';
import { auditLogService } from '@/core/security/audit.service';

/**
 * Tenant Service
 * Responsabilidades: Leer y actualizar datos de dominio del tenant
 * NO valida permisos (eso es Billing Engine)
 * NO valida pagos (eso es BillingAdapter)
 */
class TenantService {
  private supabase = createClient();

  /**
   * Registra un nuevo tenant en la base de datos
   */
  async createTenant(data: {
    name: string;
    plan: PlanType;
    industry_type: string;
    custom_domain?: string;
    active_modules?: string[];
    branding?: any;
    max_users?: number;
  }) {
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .insert({
        name: data.name,
        plan: data.plan,
        industry_type: data.industry_type,
        custom_domain: data.custom_domain,
        active_modules: data.active_modules && data.active_modules.length > 0 
          ? data.active_modules 
          : ['Dashboard', 'Inventory', 'Customers', 'Billing', 'Settings'],
        branding: data.branding || {},
        max_users: data.max_users || 3,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[TenantService] Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    // Registro Audit Log (Opcional pero recomendado)
    await auditLogService.log({
      tenantId: tenant.id,
      action: 'CREATE',
      entityType: 'TENANT',
      entityId: tenant.id,
      newData: tenant
    });

    return tenant;
  }

  /**
   * Lista TODOS los tenants (Para SuperAdmin)
   */
  async listAllTenants() {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TenantService] Error listing tenants:', error);
      throw new Error(`Failed to list tenants: ${error.message}`);
    }

    return data;
  }

   /**
   * Actualiza el plan de un tenant e informa a auditoría
   */
  async updatePlan(tenantId: string, plan: PlanType, oldPlan?: string): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .update({
        plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
      console.error('[TenantService] Error updating plan:', error);
      throw new Error(`Failed to update tenant plan: ${error.message}`);
    }

    // Registro Audit Log
    await auditLogService.logPlanChange(tenantId, oldPlan || 'unknown', plan)
  }

  /**
   * Actualiza los módulos activos de un tenant
   */
  async updateModules(tenantId: string, modules: string[], oldModules: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .update({
        active_modules: modules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
       console.error('[TenantService] Error updating modules:', error);
       throw new Error(`Failed to update modules: ${error.message}`);
    }

    // Registro Audit Log
    await auditLogService.log({
      tenantId,
      action: 'MODULE_TOGGLE',
      entityType: 'TENANT',
      entityId: tenantId,
      oldData: { modules: oldModules },
      newData: { modules }
    })
  }

  /**
   * Obtiene datos del tenant por ID
   */
  async getTenantById(tenantId: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('[TenantService] Error fetching tenant:', error);
      throw new Error(`Failed to fetch tenant: ${error.message}`);
    }

    return data;
  }
}

// Export singleton instance
export const tenantService = new TenantService();

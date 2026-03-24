import { createClient } from '@/lib/supabase/client';
import type { PlanType } from '@/config/tenants';
import { AuditLogService } from '@/core/security/audit.service';
import { logger } from '@/lib/logger';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { Json } from '@/lib/supabase/database.types';

interface TenantWithModules {
  id: string;
  name: string;
  plan: PlanType;
  industry_type: string;
  is_active: boolean;
  max_users: number;
  created_at: string;
  updated_at?: string;
  custom_domain?: string | null;
  branding?: Json;
  active_modules?: string[] | null;
  tenant_modules?: { module_slug: string }[];
}

/**
 * Tenant Service
 * Responsabilidades: Leer y actualizar datos de dominio del tenant
 * NO valida permisos (eso es Billing Engine)
 * NO valida pagos (eso es BillingAdapter)
 * @deprecated Use constructor injection with supabase client
 */
export class TenantService {
  private supabase: SupabaseClient<Database>;
  private audit: AuditLogService;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase || createClient();
    this.audit = new AuditLogService(this.supabase);
  }

  /**
   * Registra un nuevo tenant en la base de datos
   */
  async createTenant(data: {
    name: string;
    plan: PlanType;
    industry_type: string;
    custom_domain?: string;
    active_modules?: string[];
    branding?: Record<string, Json>;
    max_users?: number;
  }) {
    const defaultModules = ['Dashboard', 'Inventory', 'Customers', 'Billing', 'Settings'];
    const selectedModules = data.active_modules && data.active_modules.length > 0 
          ? data.active_modules 
          : defaultModules;

    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .insert({
        name: data.name,
        plan: data.plan,
        industry_type: data.industry_type as Database['public']['Enums']['industry_type'], 
        custom_domain: data.custom_domain,
        active_modules: selectedModules, 
        branding: data.branding || {},
        max_users: data.max_users || 3,
        is_active: true
      })
      .select('id, name, plan, industry_type, is_active, max_users, created_at')
      .single() as { data: { id: string, name: string, plan: PlanType, industry_type: string, is_active: boolean, max_users: number, created_at: string }, error: any };

    if (error) {
      logger.error('[TenantService] Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    // Insert to tenant_modules (normalized)
    const modulesToInsert = selectedModules.map(m => ({
        tenant_id: tenant.id,
        module_slug: m.toLowerCase()
    }));
    await this.supabase.from('tenant_modules').insert(modulesToInsert);

    // Registro Audit Log (Opcional pero recomendado)
    await this.audit.log({
      tenantId: tenant.id,
      action: 'CREATE',
      entityType: 'TENANT',
      entityId: tenant.id,
      newData: tenant as unknown as Record<string, Json>
    });

    return { ...tenant, active_modules: selectedModules };
  }

  /**
   * Lista TODOS los tenants (Para SuperAdmin)
   */
  async listAllTenants() {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('id, name, plan, industry_type, custom_domain, active_modules, branding, max_users, is_active, created_at, updated_at, tenant_modules(module_slug)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TenantService] Error listing tenants:', error);
      throw new Error(`Failed to list tenants: ${error.message}`);
    }

    return (data || []).map(tenant => {
      const tm = (tenant as unknown as TenantWithModules).tenant_modules;
      const activeModules = tm && tm.length > 0 
        ? tm.map(m => m.module_slug.charAt(0).toUpperCase() + m.module_slug.slice(1)) 
        : (tenant.active_modules || []);

      return {
        ...tenant,
        active_modules: activeModules,
        tenant_modules: undefined 
      };
    });
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
      logger.error('[TenantService] Error updating plan:', error);
      throw new Error(`Failed to update tenant plan: ${error.message}`);
    }

    // Registro Audit Log
    await this.audit.logPlanChange(tenantId, oldPlan || 'unknown', plan)
  }

  /**
   * Actualiza los módulos activos de un tenant
   */
  async updateModules(tenantId: string, modules: string[], oldModules: string[]): Promise<void> {
    // Legacy support update
    await this.supabase
      .from('tenants')
      .update({
        active_modules: modules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    // Relation update
    await this.supabase.from('tenant_modules').delete().eq('tenant_id', tenantId);
    if (modules.length > 0) {
        const modulesToInsert = modules.map(m => ({
            tenant_id: tenantId,
            module_slug: m.toLowerCase()
        }));
        const { error } = await this.supabase.from('tenant_modules').insert(modulesToInsert);
        if (error) {
            logger.error('[TenantService] Error updating normalized modules:', error);
            throw new Error(`Failed to update normalized modules: ${error.message}`);
        }
    }

    // Registro Audit Log
    await this.audit.log({
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
      .select('id, name, plan, industry_type, custom_domain, active_modules, branding, max_users, is_active, created_at, updated_at, tenant_modules(module_slug)')
      .eq('id', tenantId)
      .single();

    if (error) {
      logger.error('[TenantService] Error fetching tenant:', error);
      throw new Error(`Failed to fetch tenant: ${error.message}`);
    }

    const tm = (data as unknown as TenantWithModules).tenant_modules;
    const activeModules = tm && tm.length > 0 
      ? tm.map(m => m.module_slug.charAt(0).toUpperCase() + m.module_slug.slice(1)) 
      : (data.active_modules || []);

    return {
      ...data,
      active_modules: activeModules,
      tenant_modules: undefined 
    };
  }
}

// Export singleton instance
export const tenantService = new TenantService();


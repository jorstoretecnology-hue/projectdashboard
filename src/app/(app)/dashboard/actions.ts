'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

/**
 * Auto-fix para insertar modulos basicos si el tenant quedo varado.
 * Usa admin client para bypassear RLS estricto preventivo temporal.
 */
export async function forceFixTenantModules(tenantId: string, planSlug: string) {
  try {
    const supabaseAdmin = createServiceClient();
    if (!supabaseAdmin) {
      logger.error('No se pudo inicializar supabaseAdmin para fix');
      return { success: false };
    }
    
    // Asignar forzosamente los módulos usando la función RPC interna
    const { error } = await supabaseAdmin.rpc('activate_modules_for_tenant', {
      p_tenant_id: tenantId,
      p_plan_slug: planSlug
    });

    if (error) {
      // Si el RPC falla (ej: por estar mal definido), hacemos inserción manual mínima de rescate
      logger.error('[Auto-fix] RPC fallback falló, intentando inserción cruda', { error });
      
      const basicModules = ['dashboard', 'settings', 'billing', 'customers'];
      const inserts = basicModules.map(slug => ({
        tenant_id: tenantId,
        module_slug: slug,
        is_active: true
      }));
      
      const { error: insertError } = await supabaseAdmin
        .from('tenant_modules')
        .upsert(inserts, { onConflict: 'tenant_id, module_slug' });
        
      if (insertError) {
        logger.error('[Auto-fix] Inserción cruda falló', { error: insertError });
        return { success: false };
      }
    }
    
    return { success: true };
  } catch (err) {
    logger.error('[Auto-fix] Crash', { err });
    return { success: false };
  }
}

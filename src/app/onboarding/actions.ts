'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const onboardingSchema = z.object({
  name: z.string().min(2, 'El nombre de la organización es demasiado corto'),
  plan: z.string().default('free'),
  industry: z.string().min(1, 'La industria es requerida'),
  specialty: z.string().nullable().optional(),
});

/**
 * ACTION: crearTenantAction
 */
export async function createTenantAction(
  rawName: string,
  rawPlan: string = 'free',
  rawIndustry: string = 'taller',
  rawSpecialty: string | null = null,
) {
  logger.log('[Onboarding Action] createTenantAction called', {
    rawName,
    rawPlan,
    rawIndustry,
    rawSpecialty,
  });

  const supabase = await createClient();

  // 1. Validar Inputs
  const { name, plan, industry, specialty } = onboardingSchema.parse({
    name: rawName,
    plan: rawPlan,
    industry: rawIndustry,
    specialty: rawSpecialty,
  });

  logger.log('[Onboarding Action] Schema validated', { name, plan, industry, specialty });

  // 1. Obtener el usuario actual
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    logger.error('[Onboarding Action] auth.getUser failed', { error: authError });
    throw new Error('No autorizado: Debes iniciar sesión primero.');
  }

  logger.log(`[Onboarding] Starting Atomic RPC initialization`, {
    name,
    industry,
    email: user.email,
    userId: user.id,
  });

  // 2. Obtener módulos default por industria
  const { getIndustryConfig } = await import('@/config/industries');
  const industryConfig = getIndustryConfig(industry as string);
  const defaultModules = industryConfig?.defaultModules || ['Dashboard', 'Settings'];

  logger.log('[Onboarding Action] Industry config loaded', {
    industry,
    defaultModules,
  });

  // 3. LLAMAR AL RPC (Transacción Atómica en DB)
  logger.log('[Onboarding Action] Calling RPC: initialize_new_organization', {
    p_name: name,
    p_plan: plan,
    p_industry: industry,
    p_user_id: user.id,
    p_modules: defaultModules,
    p_specialty: specialty || null,
  });

  const { data: tenantId, error: rpcError } = await supabase.rpc('initialize_new_organization', {
    p_name: name,
    p_plan: plan,
    p_industry: industry,
    p_user_id: user.id,
    p_modules: defaultModules,
    p_specialty: specialty || null,
  });

  if (rpcError) {
    logger.error('[Onboarding] RPC Initialization Failure', { error: rpcError });
    throw new Error(`Fallo técnico al inicializar organización: ${rpcError.message}.`);
  }

  logger.log(`[Onboarding] Success! Organization created`, { tenantId });

  // 4. Activar módulos según plan e industria (usando RPC)
  logger.log('[Onboarding Action] Calling RPC: activate_modules_for_tenant', {
    p_tenant_id: tenantId,
    p_plan_slug: plan,
  });

  const { error: modulesError } = await supabase.rpc('activate_modules_for_tenant', {
    p_tenant_id: tenantId,
    p_plan_slug: plan,
  });

  if (modulesError) {
    logger.error('[Onboarding] Error activando módulos', { error: modulesError });
    // No bloquear el flujo — el trigger ya lo maneja como fallback
  }

  // 5. Enviar correo de bienvenida (Async)
  logger.log('[Onboarding Action] Sending welcome email');

  const { emailService } = await import('@/modules/notifications/email.service');
  if (user?.email) {
    // Intentamos enviar email pero no bloqueamos si falla
    emailService
      .sendWelcomeEmail(user.email, user.user_metadata?.full_name || name)
      .catch((e) => logger.warn('[Onboarding] Welcome email failed', { error: e }));
  }

  // 6. Actualizar JWT con tenant_id
  logger.log('[Onboarding Action] Updating user JWT with tenant_id', { tenantId });

  let supabaseAdmin;
  try {
    supabaseAdmin = createServiceClient();
    logger.log('[Onboarding Action] Service client created successfully');
  } catch (clientError) {
    logger.error('[Onboarding Action] Failed to create service client', { error: clientError });
    throw new Error('Error interno: no se pudo conectar con Supabase.');
  }

  try {
    const { data: updateData, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          tenant_id: tenantId,
          app_role: 'OWNER',
        },
      });

    if (updateError) {
      logger.error('[Onboarding Action] updateUserById failed', { error: updateError });
      // No bloquear — el tenant ya fue creado
    } else {
      logger.log('[Onboarding Action] updateUserById success', { updateData });
    }
  } catch (updateError) {
    logger.error('[Onboarding Action] Exception during updateUserById', { error: updateError });
  }

  // 7. Revalidación y redirección
  logger.log('[Onboarding Action] Revalidating and returning tenantId', { tenantId });
  revalidatePath('/dashboard');
  return tenantId;
}

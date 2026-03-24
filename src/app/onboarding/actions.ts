'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const onboardingSchema = z.object({
  name: z.string().min(2, "El nombre de la organización es demasiado corto"),
  plan: z.string().default('free'),
  industry: z.string().min(1, "La industria es requerida"),
  specialty: z.string().nullable().optional()
})

/**
 * ACTION: crearTenantAction
 */
export async function createTenantAction(rawName: string, rawPlan: string = 'free', rawIndustry: string = 'taller', rawSpecialty: string | null = null) {
  const supabase = await createClient()

  // 1. Validar Inputs
  const { name, plan, industry, specialty } = onboardingSchema.parse({
    name: rawName,
    plan: rawPlan,
    industry: rawIndustry,
    specialty: rawSpecialty
  })

  // 1. Obtener el usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado: Debes iniciar sesión primero.')

  logger.log(`[Onboarding] Starting Atomic RPC initialization`, { name, industry, email: user.email })

  // 2. Obtener módulos default por industria
  const { getIndustryConfig } = await import('@/config/industries')
  // @ts-ignore
  const industryConfig = getIndustryConfig(industry as any)
  const defaultModules = industryConfig?.defaultModules || ['Dashboard', 'Settings']

  // 3. LLAMAR AL RPC (Transacción Atómica en DB)
  // Esta función crea el tenant, vincula el perfil e inicializa cuotas.
  const { data: tenantId, error: rpcError } = await supabase.rpc('initialize_new_organization', {
    p_name: name,
    p_plan: plan,
    p_industry: industry,
    p_user_id: user.id,
    p_modules: defaultModules,
    p_specialty: specialty || null
  })

  if (rpcError) {
    logger.error("[Onboarding] RPC Initialization Failure", { error: rpcError })
    throw new Error(`Fallo técnico al inicializar organización: ${rpcError.message}.`)
  }

  logger.log(`[Onboarding] Success! Organization created`, { tenantId })

  // 4. Activar módulos según plan e industria (usando RPC)
  const { error: modulesError } = await supabase
    .rpc('activate_modules_for_tenant', {
      p_tenant_id: tenantId,
      p_plan_slug: plan
    })

  if (modulesError) {
    logger.error('[Onboarding] Error activando módulos', { error: modulesError })
    // No bloquear el flujo — el trigger ya lo maneja como fallback
  }

  // 5. Enviar correo de bienvenida (Async)
  const { emailService } = await import('@/modules/notifications/email.service')
  if (user?.email) {
      // Intentamos enviar email pero no bloqueamos si falla
      emailService.sendWelcomeEmail(user.email, user.user_metadata?.full_name || name)
        .catch(e => logger.warn("[Onboarding] Welcome email failed", { error: e }))
  }

  // 5. Revalidación y redirección
  revalidatePath('/dashboard')
  return tenantId
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const onboardingSchema = z.object({
  name: z.string().min(2, "El nombre de la organización es demasiado corto"),
  plan: z.string().default('free'),
  industry: z.string().min(1, "La industria es requerida")
})

/**
 * ACTION: crearTenantAction
 */
export async function createTenantAction(rawName: string, rawPlan: string = 'free', rawIndustry: string = 'taller') {
  const supabase = await createClient()

  // 1. Validar Inputs
  const { name, plan, industry } = onboardingSchema.parse({ 
    name: rawName, 
    plan: rawPlan, 
    industry: rawIndustry 
  })

  // 1. Obtener el usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado: Debes iniciar sesión primero.')
  
  console.log(`[Onboarding] Starting Atomic RPC initialization for: ${name} (Industry: ${industry}) User: ${user.email}`)

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
    p_modules: defaultModules
  })

  if (rpcError) {
    console.error("[Onboarding] RPC Initialization Failure:", rpcError)
    throw new Error(`Fallo técnico al inicializar organización: ${rpcError.message}.`)
  }

  console.log(`[Onboarding] Success! Organization created: ${tenantId}`)

  // 4. Enviar correo de bienvenida (Async)
  const { emailService } = await import('@/modules/notifications/email.service')
  if (user?.email) {
      // Intentamos enviar email pero no bloqueamos si falla
      emailService.sendWelcomeEmail(user.email, user.user_metadata?.full_name || name)
        .catch(e => console.warn("[Onboarding] Welcome email failed:", e))
  }

  // 5. Revalidación y redirección
  revalidatePath('/dashboard')
  return tenantId
}

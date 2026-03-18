import { redirect } from 'next/navigation'
import { getUser, getUserRole } from '@/lib/supabase/auth'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

/**
 * PAGE: POST-AUTH ROUTER
 * Este componente es server-side y decide a dónde enviar al usuario
 * justo después de que la sesión ha sido establecida.
 */
export default async function PostAuthPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const user = await getUser()
  const params = await searchParams
  const token = params.token as string | undefined
  const forceLogin = params.force_login === '1'

  // DEBUG: Si force_login=1, cerrar sesión y redirigir al login
  if (forceLogin) {
    logger.log("[PostAuth] Force login requested, clearing session")
    const supabase = await createClient()
    await supabase.auth.signOut({ scope: 'local' })
    redirect('/auth/login')
  }

  if (!user) {
    logger.log("[PostAuth] No user found, redirecting to login")
    redirect(`/auth/login${token ? `?token=${token}` : ''}`)
  }

  // 1. Obtener Metadatos del JWT / Perfil
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('app_role, tenant_id')
    .eq('id', user.id)
    .single()

  const dbRole = profile?.app_role
  const jwtRole = user.app_metadata?.app_role || user.app_metadata?.role
  const rawRole = dbRole || jwtRole || 'VIEWER'
  const role = rawRole.toUpperCase() // Normalizar a MAYÚSCULAS para comparar con 'SUPER_ADMIN'

  const tenantId = profile?.tenant_id || user.app_metadata?.tenant_id

  logger.log(`[PostAuth] User authenticated`, { email: user.email, id: user.id, dbRole, role })

  // 1.5 Si hay un token explícito de invitación, redirigir allí prioritariamente
  if (token) {
    logger.log(`[PostAuth] Token found, redirecting to invitation page`, { token })
    redirect(`/auth/invite?token=${token}`)
  }

  // 2. REGLA SUPREMA: El SUPER_ADMIN SIEMPRE va a su consola central, tenga tenant o no.
  if (role === 'SUPER_ADMIN') {
    logger.log("[PostAuth] SUPER_ADMIN detected, redirecting to central console")
    redirect('/console/dashboard')
  }

  // 3. Regla 2: Si es usuario regular y NO tiene Tenant, va a Onboarding o Invitación
  if (!tenantId) {
    logger.log("[PostAuth] No tenant_id found, checking for pending invitations", { email: user.email })

    // DEBUG: Si bypass_onboarding=1, permitir acceso al dashboard sin tenant (solo desarrollo)
    const bypassOnboarding = params.bypass_onboarding === '1'
    if (bypassOnboarding) {
      logger.log("[PostAuth] Bypass onboarding enabled (DEBUG MODE)")
      redirect('/dashboard')
    }

    // Buscar invitación pendiente para este email
    const { data: invitation } = await supabase
      .from('invitations')
      .select('id, tenant_id, app_role, email, status')
      .eq('email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (invitation) {
      logger.log(`[PostAuth] Pending invitation found, auto-accepting`, { email: user.email, tenantId: invitation.tenant_id })

      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tenant_id: invitation.tenant_id,
          app_role: invitation.app_role
        })
        .eq('id', user.id)

      if (!profileError) {
        // Marcar como aceptada
        await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id)

        // Redirigir al Dashboard
        logger.log("[PostAuth] Invitation accepted successfully, redirecting to dashboard")
        redirect('/dashboard')
      } else {
        logger.error("[PostAuth] Error auto-accepting invitation", { error: profileError })
      }
    }

    logger.log("[PostAuth] No invitation found, redirecting to onboarding")
    redirect('/onboarding')
  }

  // 4. Regla 3: Usuario normal con Tenant va al Dashboard regular
  logger.log("[PostAuth] Active session with Tenant, redirecting to dashboard")
  redirect('/dashboard')
}

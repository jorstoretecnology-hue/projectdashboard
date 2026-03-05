import { redirect } from 'next/navigation'
import { getUser, getUserRole } from '@/lib/supabase/auth'

/**
 * PAGE: POST-AUTH ROUTER
 * Este componente es server-side y decide a dónde enviar al usuario
 * justo después de que la sesión ha sido establecida.
 */
export default async function PostAuthPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const user = await getUser()
  const params = await searchParams
  const token = params.token as string | undefined
  
  if (!user) {
    console.log("[PostAuth] No user found, redirecting to login")
    redirect(`/auth/login${token ? `?token=${token}` : ''}`)
  }

  // 1. Obtener Metadatos del JWT / Perfil
  const { createClient } = await import('@/lib/supabase/server')
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

  console.log(`[PostAuth] User: ${user.email}, ID: ${user.id}, DB Role: ${dbRole}, Tenant ID: ${tenantId}, Final Role (UPPER): ${role}`)
  
  // 1.5 Si hay un token explícito de invitación, redirigir allí prioritariamente
  if (token) {
    console.log(`[PostAuth] Token found (${token}), redirecting to invitation page`)
    redirect(`/auth/invite?token=${token}`)
  }

  // 2. REGLA SUPREMA: El SUPER_ADMIN SIEMPRE va a su consola central, tenga tenant o no.
  if (role === 'SUPER_ADMIN') {
    console.log("[PostAuth] SUPER_ADMIN detected, redirecting to central console")
    redirect('/superadmin/dashboard')
  }

  // 3. Regla 2: Si es usuario regular y NO tiene Tenant, va a Onboarding o Invitación
  if (!tenantId) {
    console.log("[PostAuth] No tenant_id found, checking for pending invitations for:", user.email)
    
    // Buscar invitación pendiente para este email
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (invitation) {
      console.log(`[PostAuth] Pending invitation found for ${user.email} from tenant ${invitation.tenant_id}. Auto-accepting...`)
      
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
        console.log("[PostAuth] Invitation accepted successfully, redirecting to dashboard")
        redirect('/dashboard')
      } else {
        console.error("[PostAuth] Error auto-accepting invitation:", profileError)
      }
    }

    console.log("[PostAuth] No invitation found, redirecting to onboarding")
    redirect('/onboarding')
  }

  // 4. Regla 3: Usuario normal con Tenant va al Dashboard regular
  console.log("[PostAuth] Active session with Tenant, redirecting to dashboard")
  redirect('/dashboard')
}

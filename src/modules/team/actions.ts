import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getRequiredTenantId, getUser } from '@/lib/supabase/auth'
import { emailService } from '@/modules/notifications/email.service'

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  app_role: z.enum(['admin', 'staff', 'user'])
})

/**
 * Invitar a un nuevo miembro al equipo
 */
export async function inviteMemberAction(rawEmail: string, rawRole: 'admin' | 'staff' | 'user') {
  const supabase = await createClient()

  // 1. Validar Inputs
  const { email, app_role } = inviteSchema.parse({ email: rawEmail, app_role: rawRole })

  // 2. Resolver Tenant y Usuario de forma segura
  const tenantId = await getRequiredTenantId()
  const user = await getUser()
  if (!user) throw new Error('No autorizado')

  const inviterRole = user.app_metadata?.app_role
  const inviterName = user.user_metadata?.full_name || user.email || 'Alguien del equipo'

  if (!['admin', 'superadmin'].includes(inviterRole as string)) {
    throw new Error('No tienes permisos suficientes para invitar miembros.')
  }

  // 2. Obtener info del Tenant (para el email)
  const { data: tenant } = await supabase.from('tenants').select('name').eq('id', tenantId).single()
  const tenantName = tenant?.name || 'su organización'

  // 3. Generar Token único
  // Usamos una cadena aleatoria segura
  const token = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64').replace(/=/g, '')
  
  // 4. Guardar en DB
  const { error: inviteError } = await supabase.from('invitations').insert({
    email,
    tenant_id: tenantId,
    app_role,
    invited_by: user.id,
    token,
    status: 'pending'
  })

  if (inviteError) {
    console.error('[InviteAction] Error:', inviteError)
    throw new Error('Error al crear la invitación en la base de datos.')
  }

  // 5. Enviar Email
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?token=${token}`
  await emailService.sendInvitationEmail(email, inviterName, tenantName, inviteLink)

  revalidatePath('/settings/team')
  return { success: true }
}

/**
 * Aceptar una invitación
 */
export async function acceptInvitationAction(token: string) {
  const supabase = await createClient()

  // 1. Verificar usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Debes iniciar sesión para aceptar la invitación.')

  // 2. Buscar invitación
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitación inválida, expirada o ya utilizada.')
  }

  // 3. Validar expiración
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitation.id)
    throw new Error('La invitación ha expirado.')
  }

  // 4. Actualizar perfil del usuario
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      tenant_id: invitation.tenant_id,
      app_role: invitation.app_role.toUpperCase()
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('[AcceptInvite] Profile Error:', profileError)
    throw new Error('Error al unir al usuario a la organización.')
  }

  // 5. Marcar invitación como aceptada
  await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id)

  // 6. Refrescar sesión (importante para que el JWT obtenga el nuevo tenant_id)
  await supabase.auth.refreshSession()

  return { success: true, tenant_id: invitation.tenant_id }
}

/**
 * Obtener miembros del equipo
 */
export async function getTeamMembersAction() {
    const tenantId = await getRequiredTenantId()
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
    
    if (error) throw error
    return data
}

/**
 * Obtener invitaciones pendientes
 */
export async function getPendingInvitationsAction() {
    const tenantId = await getRequiredTenantId()
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
    
    if (error) throw error
    return data
}

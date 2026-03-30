import { createClient } from './server'
import { cache } from 'react'
import { Permission, hasPermission, FeatureFlag } from '@/config/permissions'
import { AuditLogService } from '@/core/security/audit.service'
import { logger } from '@/lib/logger'
import { headers } from 'next/headers'

/**
 * Obtiene el usuario actual.
 * Optimización: Intenta leer el ID del header inyectado por el middleware (ultra rápido).
 * Si no está disponible o se requiere el objeto completo validado, usa Supabase.
 */
export const getUser = cache(async () => {
  // 1. Intentar obtener datos básicos de los headers (inyectados por el middleware)
  try {
    const headerList = await headers()
    const userId = headerList.get('x-user-id')
    
    // Si tenemos el ID en los headers, para compatibilidad total con el resto de la app, 
    // seguimos usando supabase.auth.getUser() pero ahora está cacheado por React.cache
  } catch (e) {
    // Si falla (ej: no estamos en un entorno con headers), seguimos normal
  }

  const supabase = await createClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user
  } catch (error) {
    logger.error('Error al obtener usuario:', error)
    return null
  }
})

/**
 * Obtiene la sesión actual de forma segura en Server Components.
 * IMPORTANTE: Para validación de identidad, usar siempre getUser().
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) return null
    return session
  } catch (error) {
    return null
  }
})

/**
 * Obtiene el rol del usuario actual PRIORIZANDO la base de datos (para reflejar cambios inmediatos).
 */
export const getUserRole = cache(async () => {
  const user = await getUser()
  if (!user) return null
  
  // 1. Intentar desde Base de Datos (Verdad absoluta en tiempo real)
  try {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('app_role')
      .eq('id', user.id)
      .single()
    
    if (profile?.app_role) return profile.app_role
  } catch (e) {
    // Error silencioso en producción, pero capturado si es crítico
  }

  // 2. Fallback: JWT (Metadata sincronizada)
  const role = user.app_metadata?.app_role || user.app_metadata?.role || 'VIEWER'
  return role.toUpperCase()
})

/**
 * Verifica si el usuario actual tiene un permiso específico (SSR).
 * Optimizado para lectura desde JWT con auditoría de abusos.
 */
export async function can(permission: Permission): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const permissions = (user.app_metadata?.permissions as string[]) || []
  const role = (user.app_metadata?.app_role || 'VIEWER').toUpperCase()
  
  // 1. Validar contra el JWT (Ultra rápido)
  let hasAccess = permissions.includes(permission)

  // 2. Fallback: Si el JWT no tiene el permiso, verificamos según el ROL (RBAC Estático)
  // Esto es vital si los claims del JWT están desactualizados pero el rol es correcto.
  if (!hasAccess && role) {
    hasAccess = hasPermission(role, permission)
  }

  // 3. Auditoría de Seguridad (Registrar intentos denegados)
  if (!hasAccess) {
    const tenantId = user.app_metadata?.tenant_id
    if (tenantId) {
       const audit = new AuditLogService(await createClient())
       await audit.log({
         tenantId,
         userId: user.id,
         action: 'ACCESS_DENIED',
         entityType: 'AUTH',
         entityId: user.id,
         oldData: { permission_requested: permission, status: 'DENIED' }
       })
    }
  }

  return hasAccess
}

/**
 * Verifica si una Feature completa está habilitada para el Tenant (SSR).
 * Optimizado para lectura desde JWT.
 */
export async function canAccessFeature(feature: FeatureFlag): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const tenantFeatures = (user.app_metadata?.features as string[]) || []

  // 1. Validar contra el JWT
  if (user.app_metadata?.features) {
    return tenantFeatures.includes(feature)
  }

  // 2. Fallback: Consulta a base de datos si el JWT no tiene los metadatos (ej: sesión vieja)
  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return false

  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('feature_flags')
    .eq('id', tenantId)
    .single()

  const flags = (tenant?.feature_flags as string[] | null) || []
  return flags.includes(feature)
}

/**
 * Obtiene el tenant_id del usuario actual de forma obligatoria.
 * Lanza una excepción si el usuario no tiene un tenant asociado.
 * Útil para Server Actions de escritura.
 */
export async function getRequiredTenantId(): Promise<string> {
  const user = await getUser()
  if (!user) throw new Error('SESION_EXPIRADA: Debes iniciar sesión.')
  
  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) throw new Error('SIN_ORGANIZACION: No perteneces a ninguna organización.')
  
  return tenantId
}

/**
 * Obtiene el location_id actual de los headers (inyectado por middleware) 
 * o lanza error si es obligatorio (Server Actions de escritura).
 */
export async function getRequiredLocationId(): Promise<string> {
  const headerList = await headers()
  const locationId = headerList.get('x-location-id')
  
  if (!locationId) {
    // Si no está en header, intentamos ver si el rol permite nulo (ADMIN)
    const role = (await getUserRole())?.toUpperCase()
    if (role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      // Los administradores podrían no tener una sede fija
      return '' 
    }
    throw new Error('SEDE_REQUERIDA: Debes seleccionar una sede para esta operación.')
  }
  
  return locationId
}

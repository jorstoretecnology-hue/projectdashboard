import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { logger } from '@/lib/logger'
import { ratelimit } from '@/lib/rate-limit'

const PROTECTED_ROUTES = [
  '/dashboard', '/inventory', '/customers', '/sales',
  '/settings', '/users', '/billing', '/services', '/vehicles'
]
const SUPER_ADMIN_ROUTES = ['/console']
const PUBLIC_ROUTES = [
  '/login', '/auth/login', '/auth/register', '/auth/callback',
  '/auth/reset-password', '/auth/forgot-password', '/auth/verify',
  '/post-auth', '/register', '/test-public', '/api/v1/public',
  '/onboarding', // Onboarding es público para usuarios sin tenant
]

/**
 * Helper para ejecutar promesas con timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).then((result) => {
    clearTimeout(timeoutHandle);
    return result;
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'

  // 1. Rate Limiting con Timeout (No bloquear si Upstash tarda más de 600ms)
  if (!pathname.includes('.') && !pathname.startsWith('/_next')) {
    try {
      const { success } = await withTimeout(
        ratelimit.limit(ip),
        600,
        { success: true }
      )
      if (!success) {
        return new NextResponse('Too Many Requests', { 
          status: 429,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
    } catch (e) {
      logger.warn('[RateLimit] Error or Timeout, skipping:', e)
    }
  }

  // 2. Sincronizar Sesión y obtener datos base (UNA SOLA VEZ)
  const { response, user, profile } = await updateSession(request)

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some(r => pathname.startsWith(r))

  // 3. Lógica para usuarios NO autenticados
  if (!user) {
    if (!isPublic && (isProtected || isSuperAdminRoute)) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // 4. Lógica para usuarios autenticados
  const rawRole = profile?.app_role || user.app_metadata?.app_role || 'VIEWER'
  const role = (rawRole as string).toUpperCase()
  const tenantId = profile?.tenant_id || user.app_metadata?.tenant_id

  if (role === 'SUPER_ADMIN') {
    // Redirigir SuperAdmin al dashboard global si intenta ir a rutas de usuario/onboarding
    const restrictedForSuperAdmin = ['/', '/dashboard', '/onboarding', '/post-auth', '/auth/login']
    if (restrictedForSuperAdmin.includes(pathname)) {
      return NextResponse.redirect(new URL('/console/dashboard', request.url))
    }
  } else {
    // Usuario Normal / Admin de Tenant

    // Bloquear acceso a /console
    if (isSuperAdminRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // DEBUG: Bypass de onboarding solo para no-producción
    const isProd = process.env.NODE_ENV === 'production'
    const bypassOnboarding = !isProd && request.nextUrl.searchParams.get('bypass_onboarding') === '1'

    // Check de Onboarding: Si no tiene tenant, mandarlo a onboarding (excepto si ya está allí o en login)
    if (!tenantId && pathname !== '/onboarding' && !isPublic && !bypassOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Si ya tiene tenant y está en onboarding, mandarlo al dashboard (excepto para SuperAdmin ya manejado)
    if (tenantId && pathname === '/onboarding') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirigir desde raíz o login al dashboard
    // EXCEPTO si force_login=1 (solo para testing en no-producción)
    const forceLogin = !isProd && request.nextUrl.searchParams.get('force_login') === '1'
    if (pathname === '/' || (pathname === '/auth/login' && !forceLogin)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 5. Inyectar headers de contexto para Server Components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  if (tenantId) requestHeaders.set('x-tenant-id', (tenantId as string))
  requestHeaders.set('x-user-role', role)

  // Sede actual: Intentar desde URL params o Cookie
  const locationId = request.nextUrl.searchParams.get('location_id') || 
                     request.cookies.get('current_location_id')?.value
  if (locationId) {
    requestHeaders.set('x-location-id', locationId)
  }

  // Creamos una nueva respuesta con los headers del request actualizados
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Sincronizar cookies que updateSession pudo haber generado (refresh de sesión)
  response.cookies.getAll().forEach(cookie => {
    finalResponse.cookies.set(cookie.name, cookie.value, {
      path: '/',
      secure: true,
      sameSite: 'lax',
      ...cookie
    })
  })

  return finalResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

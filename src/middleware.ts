import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

const PROTECTED_ROUTES = [
  '/dashboard', '/inventory', '/customers', '/sales',
  '/settings', '/users', '/billing', '/services', '/vehicles'
]
const SUPER_ADMIN_ROUTES = ['/superadmin']
const PUBLIC_ROUTES = [
  '/login', '/auth/login', '/auth/register', '/auth/callback',
  '/auth/reset-password', '/auth/forgot-password',
  '/post-auth', '/register', '/test-public', '/api/v1/public',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = await updateSession(request)

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  if (isPublic) return response

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isSuperAdmin = SUPER_ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (!isProtected && !isSuperAdmin) return response

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isSuperAdmin && user.app_metadata?.app_role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isProtected) {
      const tenantId = user.app_metadata?.tenant_id
      if (!tenantId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single()
        if (!profile?.tenant_id) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }
      }
    }
  } catch (err) {
    console.error('[Middleware] Error:', err)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Supabase environment variables are missing!');
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // issues with users being logged out.

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname === '/post-auth') {
     console.log(`[Middleware] ${request.nextUrl.pathname} - User: ${user?.id} - Role: ${user?.app_metadata?.app_role} - Meta:`, user?.app_metadata)
  }

  const pathname = request.nextUrl.pathname

  // 1. Redirección para usuarios NO autenticados
  if (!user) {
    const publicRoutes = [
      '/login',
      '/auth/login',
      '/auth/register',
      '/register',
      '/api/auth',
      '/test-public'
    ];
    
    // Permitir /tracking/[id] y /api/v1/public/... sin autenticación
    const isPublicPath = 
      publicRoutes.includes(pathname) || 
      pathname.startsWith('/api/public') || 
      pathname.startsWith('/api/v1/public') ||
      pathname.startsWith('/tracking/');

    if (!isPublicPath) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No tienes una sesión activa o falta cookie.' }, { status: 401 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 2. Intentar obtener el rol de la Base de Datos (Verdad absoluta para redirección)
  let role = 'user'
  let tenantId = user.app_metadata?.tenant_id

  if (pathname === '/' || pathname === '/auth/login' || pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin') || pathname.startsWith('/api/') || pathname === '/post-auth' || pathname === '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('app_role, tenant_id')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      role = profile.app_role
      tenantId = profile.tenant_id
    } else {
      role = (user.app_metadata?.app_role || user.app_metadata?.role || 'VIEWER').toUpperCase()
    }
  }

  console.log(`[Middleware] Path: ${pathname}, User: ${user.email}, Detected Role: ${role}`)

  // 4. Lógica de Redirección según ROL
  if (role === 'SUPER_ADMIN') {
    // SuperAdmin tiene preferencia de ir a su panel global
    if (pathname === '/' || pathname === '/auth/login' || pathname.startsWith('/dashboard') || pathname === '/onboarding' || pathname === '/post-auth') {
      const url = request.nextUrl.clone()
      url.pathname = '/superadmin/dashboard'
      return NextResponse.redirect(url)
    }
    // Permitirle fluir a /superadmin/*
  } else {
    // Tenants y usuarios normales

    // CHECK CRÍTICO: Si no tienen tenant_id y NO están en onboarding, mandarlos a onboarding
    // Evita el bug donde entran al dashboard vacío.
    if (!tenantId && pathname !== '/onboarding' && pathname !== '/auth/login' && !pathname.startsWith('/auth') && pathname !== '/post-auth' && !pathname.startsWith('/api/')) {
      console.log(`[Middleware] Missing tenant_id for user ${user.id}. Redirecting to /onboarding`);
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Si YA tienen tenant y tratan de ir a onboarding, mandarlos al dashboard
    if (tenantId && pathname === '/onboarding') {
       const url = request.nextUrl.clone()
       url.pathname = '/dashboard'
       return NextResponse.redirect(url)
    }

    // No pueden entrar a /superadmin
    if (pathname.startsWith('/superadmin') && !pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Redirigir desde raíz o login si ya están autenticados
    if (pathname === '/' || pathname === '/auth/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Injectar headers de contexto para Server Components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  if (tenantId) requestHeaders.set('x-tenant-id', (tenantId as string))
  requestHeaders.set('x-user-role', role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}


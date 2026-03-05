import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

// Rutas que requieren autenticación
const protectedRoutes = [
  '/app',
  '/admin',
  '/api/protected'
]

// Rutas exclusivas para super admin
const superAdminRoutes = [
  '/superadmin',
  '/admin/superadmin'
]

// Rutas públicas
const publicRoutes = [
  '/login',
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/post-auth',
  '/register',
  '/api/auth',
  '/test-public'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // El middleware de Supabase maneja la sesión y las redirecciones de rol
  const response = await updateSession(request)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

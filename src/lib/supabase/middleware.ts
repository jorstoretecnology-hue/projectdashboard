import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * updateSession
 * Sincroniza las cookies de Supabase entre el cliente y el servidor.
 * Ahora es más ligero: no realiza redirecciones pesadas, solo retorna
 * el objeto de usuario y perfil si se obtuvieron para reutilizarlos en el proxy.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { response: supabaseResponse, user: null, profile: null }
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
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

  // Obtenemos el usuario una sola vez aquí de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  // ELIMINADO: Consulta a 'profiles' en cada request (Cuello de botella)
  // Confiamos en user.app_metadata para tenant_id y roles

  return { 
    response: supabaseResponse, 
    user, 
    profile: null, // El perfil ya no se carga en el middleware por performance
    supabase 
  }
}

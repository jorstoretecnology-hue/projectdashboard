import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/dashboard"
  const type = searchParams.get("type") // 'recovery' | 'signup' | 'magiclink' | etc.
  const inviteToken = searchParams.get("invite_token") || searchParams.get("token")

  // Validar que existe el código de autorización
  if (!code) {
    console.error("[Auth Callback] Missing authorization code")
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { 
            return cookieStore.get(name)?.value 
          },
          set(name, value, options) { 
            cookieStore.set({ name, value, ...options }) 
          },
          remove(name, options) { 
            cookieStore.set({ name, value: "", ...options }) 
          },
        },
      }
    )

    // Intercambiar código por sesión
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[Auth Callback] Error exchanging code for session:", error.message)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`)
    }

    if (!data.session) {
      console.error("[Auth Callback] No session returned after code exchange")
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`)
    }

    // Éxito: decidir redirección según el tipo de flujo
    console.log("[Auth Callback] Successfully authenticated user:", data.user?.id, "type:", type)

    // Si es un flujo de recovery (reset password), redirigir a cambio de contraseña
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    return NextResponse.redirect(`${origin}/post-auth${inviteToken ? `?token=${inviteToken}` : ''}`)

  } catch (error) {
    console.error("[Auth Callback] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.redirect(
      `${origin}/auth/login?error=server_error&message=${encodeURIComponent(errorMessage)}`
    )
  }
}


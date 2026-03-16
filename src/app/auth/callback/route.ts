import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | 'signup' | etc

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si es recuperación de contraseña, ir a reset-password
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      // Flujo normal — post-auth maneja la redirección por rol
      return NextResponse.redirect(`${origin}/post-auth`)
    } else {
      console.error("[Auth Callback] Exchange Error:", error.message)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}

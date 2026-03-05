'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Realiza un cierre de sesión profesional desde el servidor.
 * 1. Firma la salida en Supabase (limpia la sesión en el servidor)
 * 2. Invalida todas las rutas cacheadas
 * 3. Redirige al login forzando un estado limpio
 */
export async function logoutAction() {
  const supabase = await createClient()
  
  // 1. Sign out de Supabase (esto limpia las cookies de sesión automáticamente via middleware/server client)
  await supabase.auth.signOut()

  // 2. Revalidar todas las rutas para asegurar que no se sirva contenido cacheado
  revalidatePath('/', 'layout')

  // 3. Redirigir al login
  redirect('/auth/login')
}

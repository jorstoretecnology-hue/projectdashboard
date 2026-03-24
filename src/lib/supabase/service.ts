import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Cliente Supabase con Service Role Key.
 *
 * ⚠️ USO EXCLUSIVO EN SERVIDOR (webhooks, crons, scripts de migración).
 * NUNCA exponer en el cliente del navegador ni en API routes públicas.
 * Bypasea todas las políticas RLS.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      '[ServiceClient] NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no definidos.'
    )
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

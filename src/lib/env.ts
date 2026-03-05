import { z } from 'zod'

/**
 * Esquema de validación para variables de entorno
 * Asegura que todas las variables críticas estén presentes y sean válidas
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // App Config (opcional)
  NEXT_PUBLIC_APP_NAME: z.string().optional().default('Dashboard Universal'),
  NEXT_PUBLIC_DEFAULT_THEME: z.enum(['light', 'dark', 'system']).optional().default('system'),
})

/**
 * Tipo inferido del esquema de validación
 */
export type Env = z.infer<typeof envSchema>

/**
 * Valida y exporta las variables de entorno
 * Lanza un error si alguna variable requerida falta o es inválida
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_DEFAULT_THEME: process.env.NEXT_PUBLIC_DEFAULT_THEME,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const missingVars = err.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
      throw new Error(
        `❌ Variables de entorno inválidas o faltantes:\n${missingVars}\n\nVerifica tu archivo .env.local`
      )
    }
    throw err
  }
}

/**
 * Variables de entorno validadas y tipadas
 * Usar esto en lugar de process.env directamente
 * 
 * @example
 * ```ts
 * import { env } from '@/lib/env'
 * 
 * const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * ```
 */
export const env = validateEnv()

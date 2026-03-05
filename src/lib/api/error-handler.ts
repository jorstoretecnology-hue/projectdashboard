import { z } from 'zod'

/**
 * handleActionError
 * ----------------
 * Utilidad centralizada para procesar errores en Server Actions.
 * Convierte errores de Zod y errores genéricos en mensajes amigables
 * que el frontend puede mostrar directamente.
 */
export function handleActionError(error: unknown): never {
  console.error('[ActionError]:', error)

  // 1. Errores de Validación (Zod)
  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0]
    throw new Error(`VALIDACION_ERROR: ${firstIssue.message} (Campo: ${firstIssue.path.join('.')})`)
  }

  // 2. Errores conocidos de Supabase/Postgres (estrangulamos detalles sensibles)
  if (error instanceof Error) {
    // Si ya es un error formateado por nosotros, lo lanzamos tal cual
    if (error.message.includes(':')) {
      throw error
    }
    
    // Errores de duplicidad (Postgres 23505)
    if (error.message.includes('duplicate key value')) {
      throw new Error('DUPLICADO: Ya existe un registro con estos datos.')
    }

    throw new Error(`ERROR_SISTEMA: ${error.message}`)
  }

  throw new Error('ERROR_DESCONOCIDO: Ha ocurrido un fallo inesperado.')
}

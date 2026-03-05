import type { PostgrestError } from '@supabase/supabase-js'
import { toast } from 'sonner'

/**
 * Tipo de error extendido que incluye errores de Supabase
 */
export type AppError = Error | PostgrestError | unknown

/**
 * Type guard para verificar si un error es de tipo PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

/**
 * Type guard para verificar si un error es de tipo Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Extrae un mensaje de error legible de cualquier tipo de error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  
  if (isPostgrestError(error)) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'Ha ocurrido un error desconocido'
}

/**
 * Opciones para el manejo de errores
 */
interface HandleErrorOptions {
  /** Mensaje por defecto si no se puede extraer uno del error */
  fallbackMessage?: string
  /** Si se debe mostrar un toast al usuario */
  showToast?: boolean
  /** Si se debe loguear el error en consola */
  logError?: boolean
  /** Contexto adicional para el logging */
  context?: Record<string, unknown>
}

/**
 * Maneja errores de forma centralizada
 * 
 * @example
 * ```ts
 * try {
 *   await customerService.create(data)
 * } catch (error) {
 *   handleError(error, {
 *     fallbackMessage: 'Error al crear cliente',
 *     context: { customerId: data.id }
 *   })
 * }
 * ```
 */
export function handleError(error: unknown, options: HandleErrorOptions = {}): void {
  const {
    fallbackMessage = 'Ha ocurrido un error',
    showToast = true,
    logError = true,
    context = {},
  } = options

  const errorMessage = getErrorMessage(error) || fallbackMessage

  // Mostrar toast al usuario
  if (showToast) {
    toast.error(errorMessage)
  }

  // Loguear en consola para debugging
  if (logError) {
    console.error('[Error Handler]', errorMessage, {
      error,
      context,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 * 
 * @example
 * ```ts
 * const handleSubmit = withErrorHandling(
 *   async (data) => {
 *     await customerService.create(data)
 *     toast.success('Cliente creado')
 *   },
 *   { fallbackMessage: 'Error al crear cliente' }
 * )
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: HandleErrorOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, options)
      throw error // Re-lanzar para que el caller pueda manejarlo si lo necesita
    }
  }) as T
}

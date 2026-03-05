/**
 * Helper para acceso seguro a localStorage en entornos SSR
 * Previene errores cuando se ejecuta en el servidor
 */

/**
 * Obtiene localStorage de forma segura
 * Retorna null si no está disponible (SSR)
 */
export function safeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

/**
 * Obtiene un valor de localStorage de forma segura
 * 
 * @param key - Clave del item a obtener
 * @param defaultValue - Valor por defecto si no existe o no está disponible
 * @returns El valor almacenado o el valor por defecto
 * 
 * @example
 * ```ts
 * const theme = getLocalStorage('theme', 'light')
 * ```
 */
export function getLocalStorage<T = string>(key: string, defaultValue: T): T {
  const storage = safeLocalStorage()
  if (!storage) return defaultValue

  try {
    const item = storage.getItem(key)
    if (item === null) return defaultValue
    
    // Intentar parsear como JSON, si falla retornar como string
    try {
      return JSON.parse(item) as T
    } catch {
      return item as T
    }
  } catch (error) {
    console.warn(`[localStorage] Error reading key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Guarda un valor en localStorage de forma segura
 * 
 * @param key - Clave del item a guardar
 * @param value - Valor a guardar (será serializado a JSON)
 * @returns true si se guardó exitosamente, false en caso contrario
 * 
 * @example
 * ```ts
 * setLocalStorage('user', { id: '123', name: 'John' })
 * ```
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  const storage = safeLocalStorage()
  if (!storage) return false

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    storage.setItem(key, serialized)
    return true
  } catch (error) {
    console.warn(`[localStorage] Error writing key "${key}":`, error)
    return false
  }
}

/**
 * Elimina un valor de localStorage de forma segura
 * 
 * @param key - Clave del item a eliminar
 * @returns true si se eliminó exitosamente, false en caso contrario
 */
export function removeLocalStorage(key: string): boolean {
  const storage = safeLocalStorage()
  if (!storage) return false

  try {
    storage.removeItem(key)
    return true
  } catch (error) {
    console.warn(`[localStorage] Error removing key "${key}":`, error)
    return false
  }
}

/**
 * Limpia todo el localStorage de forma segura
 * 
 * @returns true si se limpió exitosamente, false en caso contrario
 */
export function clearLocalStorage(): boolean {
  const storage = safeLocalStorage()
  if (!storage) return false

  try {
    storage.clear()
    return true
  } catch (error) {
    console.warn('[localStorage] Error clearing storage:', error)
    return false
  }
}

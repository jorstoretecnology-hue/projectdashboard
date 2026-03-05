/**
 * logger.ts — Logger centralizado (Clean Code: Fase 4)
 *
 * Principio: Abstracción sobre console.log directo.
 * En producción, los métodos `log` y `warn` son no-ops.
 * Solo `error` se emite siempre para no silenciar fallos.
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Logger centralizado para toda la aplicación.
 * Reemplaza todos los console.log, console.warn y console.error directos.
 *
 * @example
 * logger.log('[TenantContext] Initialized', { tenantId })
 * logger.error('[TenantContext] Failed to load tenant', error)
 */
export const logger = {
  /** Solo visible en development. Usar para tracing y debug. */
  log: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.log(`[App] ${message}`, ...args);
    }
  },

  /** Solo visible en development. Usar para advertencias no críticas. */
  warn: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.warn(`[Warn] ${message}`, ...args);
    }
  },

  /**
   * Siempre visible (producción y desarrollo).
   * Usar para errores reales que deben ser monitorizados.
   */
  error: (message: string, ...args: unknown[]): void => {
    console.error(`[Error] ${message}`, ...args);
  },
};

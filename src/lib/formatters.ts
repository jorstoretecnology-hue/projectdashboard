/**
 * Formatea un número como moneda (COP por defecto para LATAM/Colombia)
 */
export function formatCurrency(amount: number, currency = 'COP'): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch (error) {
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Formatea una fecha en formato legible (es-CO)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(d)
}

/**
 * Formatea una fecha y hora (es-CO)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

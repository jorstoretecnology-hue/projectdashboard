/**
 * Formateadores estáticos para mejorar el rendimiento (evita re-instanciar en cada render/llamada)
 */
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const dateHeaderFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Formatea un número como moneda (COP por defecto)
 */
export function formatCurrency(amount: number): string {
  try {
    return currencyFormatter.format(amount)
  } catch (error) {
    return `$ ${amount.toLocaleString()}`
  }
}

/**
 * Formatea una fecha en formato legible (es-CO)
 */
export function formatDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return dateHeaderFormatter.format(d)
  } catch (error) {
    return String(date)
  }
}

/**
 * Formatea una fecha y hora (es-CO)
 */
export function formatDateTime(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return dateTimeFormatter.format(d)
  } catch (error) {
    return String(date)
  }
}

import { z } from 'zod'

/**
 * Reglas de validación de contraseña fuerte.
 * Requisitos: min 12 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial.
 */
export const PASSWORD_RULES = [
  { key: 'length', label: 'Mínimo 12 caracteres', test: (p: string) => p.length >= 12 },
  { key: 'uppercase', label: 'Al menos 1 letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos 1 letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Al menos 1 número', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'Al menos 1 caracter especial (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
] as const

/**
 * Esquema de Zod para contraseña fuerte.
 */
export const strongPasswordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'Debe contener al menos un caracter especial')

export interface PasswordStrengthResult {
  score: number        // 0-5 (cantidad de reglas cumplidas)
  percentage: number   // 0-100
  level: 'empty' | 'weak' | 'fair' | 'strong' | 'excellent'
  color: string        // CSS color class
  rules: { key: string; label: string; passed: boolean }[]
}

/**
 * Evalúa la fortaleza de una contraseña basándose en las reglas definidas.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      percentage: 0,
      level: 'empty',
      color: 'bg-slate-700',
      rules: PASSWORD_RULES.map(r => ({ key: r.key, label: r.label, passed: false })),
    }
  }

  const rules = PASSWORD_RULES.map(rule => ({
    key: rule.key,
    label: rule.label,
    passed: rule.test(password),
  }))

  const score = rules.filter(r => r.passed).length
  const percentage = (score / PASSWORD_RULES.length) * 100

  let level: PasswordStrengthResult['level'] = 'weak'
  let color = 'bg-red-500'

  if (score >= 5) { level = 'excellent'; color = 'bg-green-500' }
  else if (score >= 4) { level = 'strong'; color = 'bg-emerald-400' }
  else if (score >= 3) { level = 'fair'; color = 'bg-yellow-500' }
  else if (score >= 1) { level = 'weak'; color = 'bg-red-500' }

  return { score, percentage, level, color, rules }
}

/**
 * Verifica si la contraseña cumple con todos los requisitos.
 */
export function isPasswordValid(password: string): boolean {
  return getPasswordStrength(password).score === PASSWORD_RULES.length
}

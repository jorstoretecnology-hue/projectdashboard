'use client'

import { getPasswordStrength } from '@/lib/validations/password-validation'
import { Check, X } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
}

const LEVEL_LABELS: Record<string, string> = {
  empty: '',
  weak: 'Débil',
  fair: 'Regular',
  strong: 'Fuerte',
  excellent: 'Excelente',
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { percentage, level, color, rules } = getPasswordStrength(password)

  if (!password) return null

  return (
    <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Barra de Progreso */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-slate-500">Fortaleza</span>
          <span className={`${
            level === 'excellent' || level === 'strong' ? 'text-green-400' :
            level === 'fair' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {LEVEL_LABELS[level]}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Dinámico */}
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li
            key={rule.key}
            className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
              rule.passed ? 'text-green-400' : 'text-slate-500'
            }`}
          >
            {rule.passed ? (
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

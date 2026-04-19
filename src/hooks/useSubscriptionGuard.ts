"use client"

import { useState, useEffect, useCallback } from "react"

import { createClient } from "@/lib/supabase/client"
import { useTenant } from "@/providers"

export type GuardState = 'loading' | 'active' | 'blocked' | 'quota_warning'

interface QuotaUsage {
  key: string
  current: number
  limit: number
}

export function useSubscriptionGuard(moduleSlug: string, quotaKey?: string) {
  const { currentTenant, isSubscriptionBlocked, addons } = useTenant()
  const [state, setState] = useState<GuardState>('loading')
  const [quota, setQuota] = useState<QuotaUsage | null>(null)
  const supabase = createClient()

  const checkStatus = useCallback(async () => {
    if (!currentTenant) return

    // 1. Verificar si el módulo está activo para el plan actual o por addons
    const hasModuleAccess = 
      currentTenant.activeModules?.includes(moduleSlug) || 
      addons.some(a => a.module_slug === moduleSlug)

    // 2. Verificar estado base de la suscripción
    if (isSubscriptionBlocked || !hasModuleAccess) {
      setState('blocked')
      return
    }

    // 3. Si no hay quotaKey que validar, está activo
    if (!quotaKey) {
      setState('active')
      return
    }

    // 4. Validar cuotas en BD
    try {
      const { data, error } = await supabase
        .from('tenant_quotas')
        .select('current_usage, max_limit')
        .eq('tenant_id', currentTenant.id)
        .eq('resource_key', quotaKey)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setQuota({
          key: quotaKey,
          current: data.current_usage,
          limit: data.max_limit
        })

        if (data.current_usage >= data.max_limit) {
          setState('blocked')
        } else if (data.max_limit > 0 && (data.max_limit - data.current_usage) / data.max_limit <= 0.10) {
          // Queda 10% o menos de la cuota
          setState('quota_warning')
        } else {
          setState('active')
        }
      } else {
        setState('active') // Si no hay límite registrado, asumimos infinito/válido
      }
    } catch (err) {
      console.error("[useSubscriptionGuard] Error check:", err)
      setState('active') // Fail open en UI para no bloquear por errores de red, el back lo validará
    }
  }, [currentTenant, isSubscriptionBlocked, addons, moduleSlug, quotaKey, supabase])

  useEffect(() => {
    checkStatus()

    // Refrescar cada 3 minutos
    const interval = setInterval(checkStatus, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkStatus])

  return {
    state,
    canAccess: state === 'active' || state === 'quota_warning',
    quotaRemaining: quota ? Math.max(0, quota.limit - quota.current) : null,
    quota,
    refresh: checkStatus
  }
}

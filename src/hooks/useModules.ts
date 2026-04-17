import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

export type Module = {
  module_slug: string
  is_active: boolean
  activated_at?: string
  expires_at?: string | null
}

export function useModules(tenantId: string, initialModules: Module[]) {
  const [modules, setModules] = useState<Module[]>(initialModules)
  const [loading, setLoading] = useState<string | null>(null) // slug del módulo en proceso
  const [planLoading, setPlanLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Toggle individual de un módulo
  const toggleModule = useCallback(async (module_slug: string, is_active: boolean) => {
    setLoading(module_slug)
    setError(null)

    // Optimistic update
    setModules(prev =>
      prev.map(m => m.module_slug === module_slug ? { ...m, is_active } : m)
    )

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_slug, is_active }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar módulo')
      }

      router.refresh()
    } catch (err: unknown) {
      // Revertir si falla
      setModules(prev =>
        prev.map(m => m.module_slug === module_slug ? { ...m, is_active: !is_active } : m)
      )
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(null)
    }
  }, [tenantId, router])

  // Sincronizar todos los módulos según el plan
  const syncByPlan = useCallback(async (plan_slug: string) => {
    setPlanLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_slug }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al sincronizar plan')
      }

      const data = await res.json()
      // Actualizar estado local con los módulos del plan
      if (data.result?.modules_activated) {
        setModules(prev =>
          prev.map(m => ({
            ...m,
            is_active: data.result.modules_activated.includes(m.module_slug),
          }))
        )
      }

      router.refresh()
      return data.result
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      throw err
    } finally {
      setPlanLoading(false)
    }
  }, [tenantId, router])

  return { modules, toggleModule, syncByPlan, loading, planLoading, error }
}

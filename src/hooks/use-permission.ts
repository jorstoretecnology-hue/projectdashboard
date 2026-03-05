"use client"

import { useMemo } from "react"
import { useTenant } from "@/providers"
import { useModules } from "@/core/modules/module-registry"
import { resolveModuleStatus, isActionAllowedByPlan } from "@/core/billing/engine"
import { PlanTier } from "@/core/billing/plans"
import { useUser } from "@/providers"
import { Permission } from "@/config/permissions"

/**
 * usePermission
 * --------------------
 * Verifica si el usuario actual puede realizar una acción.
 * Combina seguridad por Plan (Billing) + Seguridad por Rol (RBAC).
 */
export function usePermission(permission: string): boolean {
  const { currentTenant, effectivePlan } = useTenant()
  const { can } = useUser()
  const modules = useModules()

  const hasAccess = useMemo(() => {
    // 1. RBAC: ¿Tiene el rol del usuario este permiso?
    // Si no tiene el permiso por rol, denegar inmediatamente (Enterprise security)
    if (!can(permission as Permission)) {
      return false
    }

    // 2. SaaS Isolation: ¿Hay un tenant activo?
    if (!currentTenant) return false

    // 3. Billing Engine: ¿El plan del tenant permite este módulo/acción?
    const module = modules.find(m => m.permissions.includes(permission))
    if (!module) {
      console.warn(`[Security] Permission '${permission}' not found in registry.`)
      return false
    }

    const plan = (effectivePlan as PlanTier) || "free"
    const moduleStatus = resolveModuleStatus(plan, module.key)

    if (moduleStatus !== "ACTIVE") return false

    const isActionAllowedByBilling = isActionAllowedByPlan(plan, permission)
    if (!isActionAllowedByBilling) return false

    // 4. Config Override: ¿Está el módulo activo para este tenant específico?
    const isManuallyActive = currentTenant.activeModules?.some(
      (m: string) => m.toLowerCase() === module.key.toLowerCase()
    )

    return isManuallyActive
  }, [currentTenant, effectivePlan, modules, permission, can])

  return hasAccess
}

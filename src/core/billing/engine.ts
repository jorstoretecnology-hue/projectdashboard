import { PLANS, PlanTier } from "./plans"
import { ModuleStatus } from "../modules/module-registry"

/**
 * Resolver de Estado de Módulo
 * Determina el estado de un módulo basado en el Plan.
 * 
 * Reglas:
 * 1. Si no está en 'allowedModules' -> INACTIVE
 * 2. Si está permitido -> ACTIVE (por ahora, luego RESTRICTED por quota)
 */
export function resolveModuleStatus(plan: PlanTier, moduleKey: string): ModuleStatus {
  const planConfig = PLANS[plan]
  
  if (!planConfig) {
    console.warn(`Plan ${plan} not found, defaulting to FREE behavior`)
    return "RESTRICTED"
  }

  // Normalización de keys (inventory vs Inventory)
  const isAllowed = planConfig.allowedModules.some(
    m => m.toLowerCase() === moduleKey.toLowerCase()
  )

  if (!isAllowed) {
    return "INACTIVE"
  }

  return "ACTIVE"
}

/**
 * Resolver de Permisos (Billing Guard)
 * Determina si una acción específica está permitida por el plan.
 * 
 * Ejemplo: 'inventory.create' podría bloquearse si se superó la quota.
 * Nota: La validación de quota numérica real requiere consultar el estado actual (count),
 * lo cual usualmente se hace en backend o con un hook de 'useQuota'.
 * 
 * Aquí validamos "Hard Limits" o "Feature Flags".
 */
export function isActionAllowedByPlan(plan: PlanTier, outputKey: string): boolean {
  const planConfig = PLANS[plan]
  
  if (!planConfig) return false

  // Blacklist check
  if (planConfig.restrictedPermissions?.includes(outputKey)) {
    return false
  }

  return true
}

/**
 * Helper para obtener límites
 */
export function getPlanLimits(plan: PlanTier) {
  return PLANS[plan] || PLANS.free
}

import { PLANS, PlanTier } from "./plans"
import { ModuleStatus } from "../modules/module-registry"
import { getBillingAdapter } from "./adapters"

export class BillingEngine {
  /**
   * Determina el estado de un módulo basado en el Plan.
   */
  resolveModuleStatus(plan: PlanTier, moduleKey: string): ModuleStatus {
    const planConfig = PLANS[plan]
    if (!planConfig) return "RESTRICTED"
    const isAllowed = planConfig.allowedModules.some(m => m.toLowerCase() === moduleKey.toLowerCase())
    return isAllowed ? "ACTIVE" : "INACTIVE"
  }

  /**
   * Determina si una acción específica está permitida por el plan.
   */
  isActionAllowedByPlan(plan: PlanTier, outputKey: string): boolean {
    const planConfig = PLANS[plan]
    if (!planConfig) return false
    return !(planConfig.restrictedPermissions?.includes(outputKey))
  }

  /**
   * Helper para obtener límites
   */
  getPlanLimits(plan: PlanTier) {
    return PLANS[plan] || PLANS.free
  }

  /**
   * Crea una preferencia de pago para el upgrade
   */
  async createUpgradePreference(params: {
    tenantId: string;
    targetPlan: PlanTier;
  }) {
    const adapter = getBillingAdapter();
    const planConfig = PLANS[params.targetPlan];
    
    // Aquí podrías calcular prorrateo si fuera necesario
    const amount = params.targetPlan === 'starter' ? 29000 : 
                   params.targetPlan === 'professional' ? 89000 : 
                   params.targetPlan === 'enterprise' ? 249000 : 0;

    return adapter.createPreference({
      tenantId: params.tenantId,
      targetPlan: params.targetPlan as any,
      amount,
      description: `Suscripción Plan ${params.targetPlan.toUpperCase()} - Smart Business OS`
    });
  }
}

// Exportar funciones legacy por compatibilidad
const engine = new BillingEngine();
export const resolveModuleStatus = engine.resolveModuleStatus;
export const isActionAllowedByPlan = engine.isActionAllowedByPlan;
export const getPlanLimits = engine.getPlanLimits;
export const billingEngine = engine;

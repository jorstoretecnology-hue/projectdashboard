import { useTenant } from '@/providers/TenantContext';
import { getBillingAdapter } from '@/core/billing/adapters';
import { tenantService } from '@/modules/tenants/services/tenant.service';
import { toast } from 'sonner';
import type { PlanType } from '@/config/tenants';

export function usePlanUpgrade() {
  const { setSimulatedPlan, resetSimulation, effectivePlan, isSimulated, currentTenant, updateTenant } = useTenant();

  const upgradePlan = async (targetPlanId: PlanType) => {
    if (!currentTenant) return;

    const billingAdapter = getBillingAdapter();

    const result = await billingAdapter.upgradePlan({
      tenantId: currentTenant.id,
      currentPlan: currentTenant.plan,
      targetPlan: targetPlanId,
    });

    if (!result.success) {
      toast.error(result.message || 'No se pudo realizar el upgrade.');
      return;
    }

    try {
      // Persistir el plan en base de datos
      await tenantService.updatePlan(currentTenant.id, result.plan);

      // Actualizar el tenant en el contexto (esto limpia la simulación)
      updateTenant(currentTenant.id, { plan: result.plan });

      toast.success(`Plan actualizado exitosamente. Has cambiado al plan ${result.plan}.`);
    } catch (error) {
      console.error('[usePlanUpgrade] Error persisting plan:', error);
      toast.error('El upgrade se procesó pero no se pudo guardar. Inténtalo de nuevo.');
    }
  };

  return { upgradePlan, resetSimulation, effectivePlan, isSimulated };
}

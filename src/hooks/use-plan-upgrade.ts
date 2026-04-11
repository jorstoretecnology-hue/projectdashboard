import { useState } from 'react';
import { useTenant } from '@/providers/TenantContext';
import { createUpgradePreferenceAction } from '@/app/(app)/billing/actions';
import { loadMercadoPago, openCheckout } from '@/lib/mercadopago/client-side';
import { toast } from 'sonner';
import type { PlanType } from '@/config/tenants';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export function usePlanUpgrade() {
  const { resetSimulation, effectivePlan, isSimulated, currentTenant } = useTenant();
  const [isPending, setIsPending] = useState(false);

  const upgradePlan = async (targetPlanId: PlanType) => {
    if (!currentTenant) return;

    try {
      setIsPending(true);
      const toastId = toast.loading('Preparando el pago...');

      // 1. Obtener preferencia desde el servidor
      const result = await createUpgradePreferenceAction(targetPlanId as any);

      if (!result.success || !result.preferenceId) {
        throw new Error(result.error || 'Error al generar la preferencia de pago');
      }

      // 2. Inicializar SDK en cliente
      await loadMercadoPago(env.NEXT_PUBLIC_MP_PUBLIC_KEY);

      // 3. Abrir Checkout
      toast.dismiss(toastId);
      await openCheckout(result.preferenceId);
      
      toast.info('Completa el pago en la ventana de MercadoPago');
    } catch (error) {
      logger.error('[usePlanUpgrade] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el upgrade');
    } finally {
      setIsPending(false);
    }
  };

  return { upgradePlan, resetSimulation, effectivePlan, isSimulated, isPending };
}

import type { BillingAdapter, UpgradeResult } from './billing-adapter.interface';
import type { PlanType } from '@/config/tenants';

export class MockBillingAdapter implements BillingAdapter {
  async upgradePlan(params: {
    tenantId: string;
    currentPlan: PlanType;
    targetPlan: PlanType;
  }): Promise<UpgradeResult> {
    // Simulación de latencia
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Regla básica: no downgrade
    if (params.targetPlan === params.currentPlan) {
      return {
        success: false,
        plan: params.currentPlan,
        message: 'El tenant ya está en este plan',
      };
    }

    return {
      success: true,
      plan: params.targetPlan,
      message: 'Upgrade simulado correctamente',
    };
  }

  async createPreference(params: {
    tenantId: string;
    targetPlan: PlanType;
    amount: number;
    description: string;
  }): Promise<{ success: boolean; preferenceId?: string; error?: string }> {
    return {
      success: true,
      preferenceId: `pref_mock_${Date.now()}`
    };
  }
}

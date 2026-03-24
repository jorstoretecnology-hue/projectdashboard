import type { PlanType } from '@/config/tenants';

export interface UpgradeResult {
  success: boolean;
  plan: PlanType;
  message?: string;
}

/**
 * Billing Adapter Contract
 * Cualquier pasarela (real o simulada) debe implementar esto
 */
export interface BillingAdapter {
  upgradePlan(params: {
    tenantId: string;
    currentPlan: PlanType;
    targetPlan: PlanType;
  }): Promise<UpgradeResult>;

  createPreference(params: {
    tenantId: string;
    targetPlan: PlanType;
    amount: number;
    description: string;
  }): Promise<{ success: boolean; preferenceId?: string; error?: string }>;
}

'use server'

import { createClient } from '@/lib/supabase/server';
import { getRequiredTenantId } from '@/lib/supabase/auth';
import { billingEngine } from '@/core/billing/engine';
import { logger } from '@/lib/logger';
import { PlanTier } from '@/core/billing/plans';

/**
 * Crea una preferencia de pago en MercadoPago para subir de plan
 */
export async function createUpgradePreferenceAction(targetPlan: PlanTier) {
  try {
    const tenantId = await getRequiredTenantId();
    logger.log(`[Billing Action] Creating upgrade preference for ${tenantId} to ${targetPlan}`);

    // Delegar al motor de billing que usa el adapter de MercadoPago
    const result = await billingEngine.createUpgradePreference({
      tenantId,
      targetPlan
    });

    if (!result.success) {
      throw new Error(result.error || 'No se pudo crear la preferencia de pago');
    }

    return { 
      success: true, 
      preferenceId: result.preferenceId 
    };
  } catch (error) {
    logger.error('[Billing Action] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno' 
    };
  }
}

import type { BillingAdapter, UpgradeResult } from './billing-adapter.interface';
import type { PlanType } from '@/config/tenants';
import { preferences } from '@/lib/mercadopago/client';
import { logger } from '@/lib/logger';

export class MercadoPagoAdapter implements BillingAdapter {
  async upgradePlan(params: {
    tenantId: string;
    currentPlan: PlanType;
    targetPlan: PlanType;
  }): Promise<UpgradeResult> {
    // MP generalmente actualiza vía Webhook, pero aquí podemos hacer validación previa
    return {
      success: true,
      plan: params.targetPlan,
      message: 'Iniciando proceso de pago con MercadoPago'
    };
  }

  async createPreference(params: {
    tenantId: string;
    targetPlan: PlanType;
    amount: number;
    description: string;
  }): Promise<{ success: boolean; preferenceId?: string; error?: string }> {
    try {
      const result = await preferences.create({
        body: {
          items: [
            {
              id: `plan-${params.targetPlan}`,
              title: params.description,
              quantity: 1,
              unit_price: params.amount,
              currency_id: 'COP' // Debería venir de config
            }
          ],
          external_reference: params.tenantId, // Crucial para el webhook
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_APP_URL}/billing?status=success`,
            failure: `${process.env.NEXT_PUBLIC_APP_URL}/billing?status=failure`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL}/billing?status=pending`
          },
          auto_return: 'approved'
        }
      });

      return {
        success: true,
        preferenceId: result.id
      };
    } catch (error) {
      logger.error('[MP Adapter] Error creating preference:', error);
      return {
        success: false,
        error: 'Error al conectar con MercadoPago'
      };
    }
  }
}

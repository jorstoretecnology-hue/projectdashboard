import { MockBillingAdapter } from './mock-billing.adapter';
import { MercadoPagoAdapter } from './mercadopago.adapter';
import type { BillingAdapter } from './billing-adapter.interface';

/**
 * Resolver central de Billing Adapter
 */
export function getBillingAdapter(): BillingAdapter {
  if (process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.NODE_ENV === 'production') {
    return new MercadoPagoAdapter();
  }
  return new MockBillingAdapter();
}

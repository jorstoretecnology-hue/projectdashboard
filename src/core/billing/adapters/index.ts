import { MockBillingAdapter } from './mock-billing.adapter';
import type { BillingAdapter } from './billing-adapter.interface';

/**
 * Resolver central de Billing Adapter
 * En el futuro se cambia aquí sin tocar UI ni Engine
 */
export function getBillingAdapter(): BillingAdapter {
  // Futuro:
  // if (env === "production") return new WompiAdapter()
  return new MockBillingAdapter();
}

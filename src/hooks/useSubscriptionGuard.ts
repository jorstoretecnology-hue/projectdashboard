'use client';

import { useTenant } from '@/providers/TenantContext';

// Módulos que requieren suscripción activa para escritura
const WRITE_PROTECTED_MODULES = ['sales', 'inventory', 'work_orders'] as const;

export function useSubscriptionGuard(moduleSlug: string) {
  const { subscription, isSubscriptionBlocked } = useTenant();

  const isBlocked =
    isSubscriptionBlocked &&
    WRITE_PROTECTED_MODULES.includes(moduleSlug as (typeof WRITE_PROTECTED_MODULES)[number]);

  return {
    isBlocked,
    subscriptionStatus: subscription?.status ?? null,
  };
}

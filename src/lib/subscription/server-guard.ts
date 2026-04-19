'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { SubscriptionStatus } from '@/providers/TenantContext';

export interface SubscriptionGuardResult {
  allowed: boolean;
  tenantId: string | null;
  status: SubscriptionStatus | 'unauthenticated' | 'not_found' | 'expired' | 'error';
  reason?: string;
}

const VALID_STATUSES: SubscriptionStatus[] = ['active', 'trialing'];

const PROTECTED_MODULES = ['pos', 'inventory', 'billing', 'sales', 'work_orders'];

export async function validateSubscription(moduleSlug?: string): Promise<SubscriptionGuardResult> {
  await cookies();
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        allowed: false,
        tenantId: null,
        status: 'unauthenticated',
        reason: 'No autenticado',
      };
    }

    const tenantId = user.app_metadata?.tenant_id as string | undefined;
    if (!tenantId) {
      return {
        allowed: false,
        tenantId: null,
        status: 'not_found',
        reason: 'Sin empresa asociada',
      };
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, plan, active_modules, subscription')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return {
        allowed: false,
        tenantId,
        status: 'not_found',
        reason: 'Empresa no encontrada',
      };
    }

    const subscription = tenant.subscription as { status: SubscriptionStatus } | null;
    const subscriptionStatus = subscription?.status || 'cancelled';
    const isActive = VALID_STATUSES.includes(subscriptionStatus);

    if (!isActive) {
      return {
        allowed: false,
        tenantId,
        status: subscriptionStatus,
        reason: `Suscripción ${subscriptionStatus}`,
      };
    }

    if (moduleSlug && PROTECTED_MODULES.includes(moduleSlug)) {
      const activeModules = (tenant.active_modules as string[]) || [];
      const hasModuleAccess = activeModules.includes(moduleSlug);

      if (!hasModuleAccess) {
        return {
          allowed: false,
          tenantId,
          status: subscriptionStatus,
          reason: `Módulo ${moduleSlug} no activo`,
        };
      }
    }

    return {
      allowed: true,
      tenantId,
      status: subscriptionStatus,
    };
  } catch {
    return {
      allowed: false,
      tenantId: null,
      status: 'error',
      reason: 'Error de validación',
    };
  }
}

export async function requireSubscription(moduleSlug?: string): Promise<string> {
  const result = await validateSubscription(moduleSlug);

  if (!result.allowed) {
    if (result.status === 'unauthenticated') {
      redirect('/auth/login');
    }
    redirect(`/billing?status=${result.status}&reason=${encodeURIComponent(result.reason || '')}`);
  }

  return result.tenantId!;
}

export async function checkSubscription(moduleSlug?: string): Promise<SubscriptionGuardResult> {
  return validateSubscription(moduleSlug);
}

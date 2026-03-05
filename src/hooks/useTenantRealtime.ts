'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { TenantConfig } from '@/config/tenants';

type OnTenantUpdate = (updatedFields: Partial<TenantConfig>) => void;

/**
 * useTenantRealtime — Suscripción Supabase Realtime para cambios del tenant.
 * SRP: responsabilidad única de escuchar cambios en la tabla `tenants` y
 * llamar al callback cuando haya una actualización relevante.
 *
 * @param tenantId - ID del tenant a escuchar
 * @param onUpdate - Callback con los fields actualizados
 */
export function useTenantRealtime(
  tenantId: string | null,
  onUpdate: OnTenantUpdate
): void {
  const supabase = createClient();

  useEffect(() => {
    if (!tenantId) return;

    logger.log('[useTenantRealtime] Subscribing to tenant', tenantId);

    const channel = supabase
      .channel(`tenant-updates-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tenants',
          filter: `id=eq.${tenantId}`,
        },
        (payload) => {
          logger.log('[useTenantRealtime] Update received', payload);
          const updated = payload.new as Record<string, unknown>;
          onUpdate({
            activeModules: (updated.active_modules as string[]) ?? [],
            plan: updated.plan as TenantConfig['plan'],
            isActive: (updated.is_active as boolean) ?? true,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, onUpdate]);
}

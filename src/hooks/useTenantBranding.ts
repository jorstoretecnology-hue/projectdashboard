'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import type { TenantConfig } from '@/config/tenants';

/**
 * useTenantBranding — Aplica variables CSS de branding al documento.
 * SRP: responsabilidad única de sincronizar el tema visual con el tenant activo.
 *
 * @param currentTenant - El tenant actual del contexto
 */
export function useTenantBranding(currentTenant: TenantConfig | null): void {
  useEffect(() => {
    if (!currentTenant?.branding?.primaryColor) return;

    const root = document.documentElement;
    const color = currentTenant.branding.primaryColor;

    logger.log('[useTenantBranding] Applying branding for tenant', currentTenant.name);

    root.style.setProperty('--primary', color);
    root.style.setProperty('--ring', color);
    root.style.setProperty('--sidebar-ring', color);
    root.style.setProperty('--gradient-start', color);
    root.style.setProperty('--gradient-end', color);

    document.body.classList.add('branding-applied');
  }, [currentTenant]);
}

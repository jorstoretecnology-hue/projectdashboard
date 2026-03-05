'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Sale, SaleQuery } from '@/modules/sales/types';

/**
 * useEvents — Hook para eventos de dominio del Dashboard.
 * SRP: centraliza la lógica de fetch y suscripción a domain_events.
 */
export function useEvents(tenantId: string | null) {
  const [events, setEvents] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    logger.log('[useEvents] Fetching domain events for tenant', tenantId);

    const { data, error: fetchError } = await supabase
      .from('domain_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      logger.error('[useEvents] Error fetching events', fetchError.message);
      setError(fetchError.message);
    } else {
      setEvents((data ?? []) as Sale[]);
    }

    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}

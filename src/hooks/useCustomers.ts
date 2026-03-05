'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Customer } from '@/modules/customers/types';

/**
 * useCustomers — Hook para gestión de clientes.
 * SRP: centraliza fetch y búsqueda de la tabla `customers`.
 */
export function useCustomers(tenantId: string | null, searchTerm?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCustomers = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    logger.log('[useCustomers] Fetching customers', { tenantId, searchTerm });

    let dbQuery = supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (searchTerm && searchTerm.length > 0) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );
    }

    const { data, error: fetchError } = await dbQuery;

    if (fetchError) {
      logger.error('[useCustomers] Error fetching customers', fetchError.message);
      setError(fetchError.message);
    } else {
      setCustomers((data ?? []) as Customer[]);
    }

    setIsLoading(false);
  }, [tenantId, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, isLoading, error, refetch: fetchCustomers };
}

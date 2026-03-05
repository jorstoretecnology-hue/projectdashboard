'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Sale, SaleQuery } from '@/modules/sales/types';

/**
 * useSales — Hook para gestión de ventas.
 * SRP: centraliza fetch, paginación y filtros de la tabla `sales`.
 * Los componentes solo consumen datos, no saben cómo se obtienen.
 */
export function useSales(tenantId: string | null, query?: SaleQuery) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = createClient();

  const fetchSales = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    logger.log('[useSales] Fetching sales', { tenantId, query });

    let dbQuery = supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(*),
        customer:customers(first_name, last_name, company_name)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (query?.state) dbQuery = dbQuery.eq('state', query.state);
    if (query?.customer_id) dbQuery = dbQuery.eq('customer_id', query.customer_id);
    if (query?.start_date) dbQuery = dbQuery.gte('created_at', query.start_date);
    if (query?.end_date) dbQuery = dbQuery.lte('created_at', query.end_date);

    const sortBy = query?.sort_by ?? 'created_at';
    const sortOrder = query?.sort_order ?? 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    dbQuery = dbQuery.range((page - 1) * limit, page * limit - 1);

    const { data, error: fetchError, count } = await dbQuery;

    if (fetchError) {
      logger.error('[useSales] Error fetching sales', fetchError.message);
      setError(fetchError.message);
    } else {
      setSales((data ?? []) as Sale[]);
      setTotal(count ?? 0);
    }

    setIsLoading(false);
  }, [tenantId, JSON.stringify(query)]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { sales, isLoading, error, total, refetch: fetchSales };
}

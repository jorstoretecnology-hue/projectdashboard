'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Sale, SaleQuery } from '@/modules/sales/types';

/**
 * useSales — Hook para gestión de ventas.
 * SRP: centraliza fetch, paginación y filtros de la tabla `sales`.
 * Los componentes solo consumen datos, no saben cómo se obtienen.
 *
 * Optimizaciones aplicadas:
 * - useMemo para queryKey estable
 * - Deduplicación de requests
 * - Dependencias de useCallback optimizadas
 */
export function useSales(tenantId: string | null, query?: SaleQuery) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized query key para evitar recreaciones
  const queryKey = useMemo(
    () => ({
      state: query?.state,
      customer_id: query?.customer_id,
      start_date: query?.start_date,
      end_date: query?.end_date,
      sort_by: query?.sort_by ?? 'created_at',
      sort_order: query?.sort_order ?? 'desc',
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
    }),
    [
      query?.state,
      query?.customer_id,
      query?.start_date,
      query?.end_date,
      query?.sort_by,
      query?.sort_order,
      query?.page,
      query?.limit,
    ],
  );

  const fetchSales = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    // Cancelar request previo
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    logger.log('[useSales] Fetching sales', { tenantId, query: queryKey });

    let dbQuery = supabase
      .from('sales')
      .select(
        `
        id, 
        customer_id, 
        state, 
        subtotal, 
        discount, 
        tax, 
        total, 
        payment_method, 
        created_at,
        customer:customers(first_name, last_name, company_name),
        items:sale_items(
          id,
          product_id,
          product_name,
          unit_price,
          quantity,
          subtotal
        )
      `,
        { count: 'exact' },
      )
      .eq('tenant_id', tenantId);

    if (queryKey.state) dbQuery = dbQuery.eq('state', queryKey.state);
    if (queryKey.customer_id) dbQuery = dbQuery.eq('customer_id', queryKey.customer_id);
    if (queryKey.start_date) dbQuery = dbQuery.gte('created_at', queryKey.start_date);
    if (queryKey.end_date) dbQuery = dbQuery.lte('created_at', queryKey.end_date);

    const sortBy = queryKey.sort_by;
    const sortOrder = queryKey.sort_order;
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    const page = queryKey.page;
    const limit = queryKey.limit;
    dbQuery = dbQuery.range((page - 1) * limit, page * limit - 1);

    const { data, error: fetchError, count } = await dbQuery;

    if (fetchError) {
      logger.error('[useSales] Error fetching sales', fetchError.message);
      setError(fetchError.message);
    } else {
      setSales((data || []) as unknown as Sale[]);
      setTotal(count ?? 0);
    }

    setIsLoading(false);
  }, [tenantId, JSON.stringify(queryKey)]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { sales, isLoading, error, total, refetch: fetchSales };
}

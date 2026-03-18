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
      .select('id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, metadata, city, location_id, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (searchTerm && searchTerm.length > 0) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );
    }

    const { data, error: fetchError } = await dbQuery;

    if (fetchError) {
      logger.error('[useCustomers] Error fetching customers', { error: fetchError.message });
      setError(fetchError.message);
    } else {
      // Convert snake_case DB fields to camelCase Customer interface con valores default
      const customers = (data ?? []).map(item => ({
        id: item.id,
        firstName: item.first_name ?? '',
        lastName: item.last_name ?? '',
        email: item.email,
        phone: item.phone ?? '',
        companyName: item.company_name ?? '',
        taxId: item.tax_id ?? '',
        identificationType: (item as any).identification_type ?? 'CC',
        identificationNumber: (item as any).identification_number ?? '',
        address: item.address ?? '',
        city: item.address ?? '', // Usar address como city fallback
        locationId: item.location_id,
        status: item.status ?? 'active',
        notes: item.notes ?? '',
        website: item.website ?? '',
        metadata: {}, // metadata no existe en DB
        createdAt: item.created_at ?? undefined,
      }))
      setCustomers(customers)
    }

    setIsLoading(false);
  }, [tenantId, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, isLoading, error, refetch: fetchCustomers };
}

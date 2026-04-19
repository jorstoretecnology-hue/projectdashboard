'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { PERMISSIONS } from '@/config/permissions';
import { can, getRequiredTenantId } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

import { EnhancedCustomersService } from './services/customers.service';
import type { CustomerFormValues, Customer} from './types';
import { createCustomerSchema } from './types';

/**
 * SERVER ACTIONS - Módulo de Clientes
 */


export async function createCustomerAction(rawData: CustomerFormValues): Promise<Customer> {
  const supabase = await createClient();
  const tenantId = await getRequiredTenantId();
  const customersService = new EnhancedCustomersService(supabase, tenantId);

  if (!(await can(PERMISSIONS.CUSTOMERS_CREATE))) {
    throw new Error('ACCESO_DENEGADO: No tienes permiso para crear clientes.');
  }

  const data = createCustomerSchema.parse(rawData);

  if (!data.data_consent_accepted) {
    throw new Error(
      'Validación fallida: El consentimiento de datos es obligatorio al crear un cliente.',
    );
  }

  const headersList = await headers();
  let ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();

  const enhancedData = {
    ...data,
    data_consent_at: new Date().toISOString(),
    data_consent_ip: ip,
    data_consent_version: 'v1.0',
  };

  const result = await customersService.create(enhancedData, tenantId);

  revalidatePath('/customers');
  return result;
}

export async function updateCustomerAction(
  id: string,
  rawData: Partial<CustomerFormValues>,
): Promise<Customer> {
  const supabase = await createClient();
  const tenantId = await getRequiredTenantId();
  const customersService = new EnhancedCustomersService(supabase, tenantId);

  if (!(await can(PERMISSIONS.CUSTOMERS_EDIT))) {
    throw new Error('ACCESO_DENEGADO: No tienes permiso para editar clientes.');
  }

  const data = createCustomerSchema.partial().parse(rawData);
  const result = await customersService.update(id, data, tenantId);
  revalidatePath('/customers');
  return result;
}

export async function deleteCustomerAction(id: string): Promise<void> {
  const supabase = await createClient();
  const tenantId = await getRequiredTenantId();
  const customersService = new EnhancedCustomersService(supabase, tenantId);

  if (!(await can(PERMISSIONS.CUSTOMERS_DELETE))) {
    throw new Error('ACCESO_DENEGADO: No tienes permiso para eliminar clientes.');
  }

  await customersService.delete(id, tenantId);
  revalidatePath('/customers');
}

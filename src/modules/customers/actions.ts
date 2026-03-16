'use server'

import { createClient } from "@/lib/supabase/server"
import { can, getRequiredTenantId } from "@/lib/supabase/auth"
import { PERMISSIONS } from "@/config/permissions"
import { EnhancedCustomersService } from "./services/customers.service"
import { revalidatePath } from "next/cache"
import { CustomerFormValues, Customer, createCustomerSchema } from "./types"

/**
 * SERVER ACTIONS - Módulo de Clientes
 */

export async function createCustomerAction(rawData: CustomerFormValues): Promise<Customer> {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()
  const customersService = new EnhancedCustomersService(supabase, tenantId)

  if (!(await can(PERMISSIONS.CUSTOMERS_CREATE))) {
    throw new Error("ACCESO_DENEGADO: No tienes permiso para crear clientes.")
  }

  const data = createCustomerSchema.parse(rawData)
  const result = await customersService.create(data, tenantId)

  revalidatePath('/customers')
  return result
}

export async function updateCustomerAction(id: string, rawData: Partial<CustomerFormValues>): Promise<Customer> {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()
  const customersService = new EnhancedCustomersService(supabase, tenantId)

  if (!(await can(PERMISSIONS.CUSTOMERS_EDIT))) {
    throw new Error("ACCESO_DENEGADO: No tienes permiso para editar clientes.")
  }

  const data = createCustomerSchema.partial().parse(rawData)
  const result = await customersService.update(id, data, tenantId)
  revalidatePath('/customers')
  return result
}

export async function deleteCustomerAction(id: string, _tenantId?: string): Promise<void> {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()
  const customersService = new EnhancedCustomersService(supabase, tenantId)

  if (!(await can(PERMISSIONS.CUSTOMERS_DELETE))) {
    throw new Error("ACCESO_DENEGADO: No tienes permiso para eliminar clientes.")
  }

  await customersService.delete(id, tenantId)
  revalidatePath('/customers')
}

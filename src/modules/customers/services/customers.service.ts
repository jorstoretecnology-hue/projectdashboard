import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"
import { Customer, CustomerFormValues } from "../types"
import { quotaEngine } from "@/core/quotas/engine"
import { auditLogService } from "@/core/security/audit.service"
import { logger } from "@/lib/logger"

type DBCustomer = Database['public']['Tables']['customers']['Row']

/**
 * CustomersService Wrapper con Lógica de Negocio Extendida
 */
export class EnhancedCustomersService {
  constructor(private supabaseClient: SupabaseClient<Database>, private tenantIdOverride?: string) {}

  async list(tenantId: string, page = 1, limit = 50): Promise<{ data: Customer[], total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // city y metadata no existen en la tabla customers - usar solo campos existentes
    const { data, count, error } = await this.supabaseClient
      .from("customers")
      .select("id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, location_id, created_at, updated_at", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      logger.error("[CustomersService] List Error", { error })
      throw new Error(`Error al listar clientes: ${error.message}`)
    }

    // Convertir de snake_case (DB) a camelCase (domain) con valores default
    const customers = (data || []).map(dbItem => ({
      id: dbItem.id,
      firstName: dbItem.first_name ?? '',
      lastName: dbItem.last_name ?? '',
      email: dbItem.email,
      phone: dbItem.phone ?? '',
      companyName: dbItem.company_name ?? '',
      taxId: dbItem.tax_id ?? '',
      identificationType: (dbItem as any).identification_type ?? 'CC',
      identificationNumber: (dbItem as any).identification_number ?? '',
      address: dbItem.address ?? '',
      city: dbItem.address ?? '', // Usar address como city fallback
      locationId: dbItem.location_id ?? undefined, // null -> undefined
      status: (dbItem.status as 'active' | 'inactive' | 'lead') ?? 'active',
      notes: dbItem.notes ?? '',
      website: dbItem.website ?? '',
      metadata: {}, // metadata no existe en DB, usar default
      createdAt: dbItem.created_at ?? undefined,
      updatedAt: dbItem.updated_at ?? undefined,
    }))

    return {
      data: customers,
      total: count || 0
    }
  }

  async create(data: CustomerFormValues, tenantId: string): Promise<Customer> {
    await quotaEngine.assertCanConsume(tenantId, "maxCustomers")

    // Convertir de camelCase (frontend) a snake_case (database)
    const dbData: any = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      company_name: data.companyName,
      tax_id: data.taxId,
      identification_type: data.identificationType,
      identification_number: data.identificationNumber,
      address: data.address,
      city: data.city,
      location_id: data.locationId,
      status: data.status,
      notes: data.notes,
      website: data.website,
      tenant_id: tenantId,
    };

    const { data: newCustomer, error } = await this.supabaseClient
      .from("customers")
      .insert(dbData)
      .select()
      .single()

    if (error) {
      logger.error("[CustomersService] Create Error", { error })
      throw new Error(`No se pudo crear el cliente: ${error.message}`)
    }

    await Promise.all([
      quotaEngine.incrementUsage(tenantId, "maxCustomers"),
      auditLogService.logResourceCreate(
        tenantId,
        'CUSTOMER',
        newCustomer.id,
        newCustomer
      )
    ])

    // Convertir a domain con valores default
    return {
      ...data,
      id: newCustomer.id,
      identificationType: (newCustomer as any).identification_type ?? 'CC',
      identificationNumber: (newCustomer as any).identification_number ?? '',
      city: (newCustomer as any).city ?? newCustomer.address ?? '',
      metadata: {}, // metadata no existe en DB
      createdAt: newCustomer.created_at ?? undefined,
      updatedAt: newCustomer.updated_at ?? undefined,
    };
  }

  async update(id: string, data: Partial<CustomerFormValues>, tenantId: string): Promise<Customer> {
    // Convertir de camelCase (frontend) a snake_case (database)
    const dbData: any = {};
    if (data.firstName !== undefined) dbData.first_name = data.firstName;
    if (data.lastName !== undefined) dbData.last_name = data.lastName;
    if (data.email !== undefined) dbData.email = data.email;
    if (data.phone !== undefined) dbData.phone = data.phone;
    if (data.companyName !== undefined) dbData.company_name = data.companyName;
    if (data.taxId !== undefined) dbData.tax_id = data.taxId;
    if (data.identificationType !== undefined) dbData.identification_type = data.identificationType;
    if (data.identificationNumber !== undefined) dbData.identification_number = data.identificationNumber;
    if (data.address !== undefined) dbData.address = data.address;
    if (data.city !== undefined) dbData.city = data.city;
    if (data.locationId !== undefined) dbData.location_id = data.locationId;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.notes !== undefined) dbData.notes = data.notes;
    if (data.website !== undefined) dbData.website = data.website;

    const { data: updatedCustomer, error } = await this.supabaseClient
      .from("customers")
      .update(dbData)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single()

    if (error) {
      logger.error("[CustomersService] Update Error", { error })
      throw new Error("No se pudo actualizar el cliente.")
    }

    await auditLogService.logResourceUpdate(
      tenantId,
      'CUSTOMER',
      id,
      data
    )

    // Convertir a domain con valores default
    return {
      ...data,
      id: updatedCustomer.id,
      firstName: updatedCustomer.first_name ?? data.firstName ?? '',
      lastName: updatedCustomer.last_name ?? data.lastName ?? '',
      email: updatedCustomer.email,
      phone: updatedCustomer.phone ?? '',
      companyName: updatedCustomer.company_name ?? '',
      taxId: updatedCustomer.tax_id ?? '',
      identificationType: (updatedCustomer as any).identification_type ?? 'CC',
      identificationNumber: (updatedCustomer as any).identification_number ?? '',
      address: updatedCustomer.address ?? '',
      city: (updatedCustomer as any).city ?? updatedCustomer.address ?? '',
      locationId: updatedCustomer.location_id,
      status: updatedCustomer.status ?? 'active',
      notes: updatedCustomer.notes ?? '',
      website: updatedCustomer.website ?? '',
      metadata: {}, // metadata no existe en DB
      createdAt: updatedCustomer.created_at ?? undefined,
      updatedAt: updatedCustomer.updated_at ?? undefined,
    } as Customer;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      logger.error("[CustomersService] Error", { error })
      throw new Error("Error en operación de cliente.")
    }

    await Promise.all([
      quotaEngine.decrementUsage(tenantId, "maxCustomers"),
      auditLogService.logResourceDelete(tenantId, 'CUSTOMER', id)
    ])
  }

  /**
   * Restaura un cliente previamente eliminado.
   */
  async restore(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabaseClient.rpc('restore_record', {
      target_table: 'customers',
      record_id: id,
      target_tenant_id: tenantId
    })

    if (error) {
      logger.error("[CustomersService] Restore Error:", error)
      throw new Error("No se pudo restaurar el cliente.")
    }

    await quotaEngine.incrementUsage(tenantId, "maxCustomers")
  }

  async getCustomers(query: any) {
    return this.list(query.tenant_id || this.tenantIdOverride, query.page, query.limit);
  }

  async getCustomerById(id: string) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for getCustomerById");

    // city y metadata no existen en la tabla customers
    const { data, error } = await this.supabaseClient
      .from("customers")
      .select("id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, location_id, created_at")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Customer not found');
      throw error;
    }

    // Convertir a domain con valores default
    const dbItem = data as any;
    return {
      id: dbItem.id,
      firstName: dbItem.first_name ?? '',
      lastName: dbItem.last_name ?? '',
      email: dbItem.email,
      phone: dbItem.phone ?? '',
      companyName: dbItem.company_name ?? '',
      taxId: dbItem.tax_id ?? '',
      identificationType: dbItem.identification_type ?? 'CC',
      identificationNumber: dbItem.identification_number ?? '',
      address: dbItem.address ?? '',
      city: dbItem.address ?? '', // Usar address como city fallback
      locationId: dbItem.location_id,
      status: dbItem.status ?? 'active',
      notes: dbItem.notes ?? '',
      website: dbItem.website ?? '',
      metadata: {}, // metadata no existe en DB
      createdAt: dbItem.created_at ?? undefined,
    };
  }

  async createCustomer(data: CustomerFormValues) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for createCustomer");
    return this.create(data, tenantId);
  }

  async updateCustomer(id: string, data: Partial<CustomerFormValues>) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for updateCustomer");
    return this.update(id, data, tenantId);
  }

  async deleteCustomer(id: string) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for deleteCustomer");
    return this.delete(id, tenantId);
  }
}

// Exportamos la clase para inyección de dependencias
// En Server Actions se debe instanciar con el cliente de servidor.

// Singleton para uso en client-side – el tenantId se pasa por método
import { createClient } from '@/lib/supabase/client'
export const customersService = new EnhancedCustomersService(createClient())

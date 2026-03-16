import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"
import { Customer, CustomerFormValues, toDbCustomer, fromDbCustomer } from "../types"
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

    const { data, count, error } = await this.supabaseClient
      .from("customers")
      .select("id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, metadata, city, location_id, created_at, updated_at", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      logger.error("[CustomersService] List Error", { error })
      throw new Error(`Error al listar clientes: ${error.message}`)
    }

    return {
      data: (data || []).map(this.mapToDomain),
      total: count || 0
    }
  }

  async create(data: CustomerFormValues, tenantId: string): Promise<Customer> {
    await quotaEngine.assertCanConsume(tenantId, "maxCustomers")

    // Convertir de camelCase (frontend) a snake_case (database)
    const dbData = toDbCustomer(data);

    const { data: newCustomer, error } = await this.supabaseClient
      .from("customers")
      .insert({
        ...dbData,
        name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || null,
        tenant_id: tenantId,
      })
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

    return this.mapToDomain(newCustomer)
  }

  async update(id: string, data: Partial<CustomerFormValues>, tenantId: string): Promise<Customer> {
    const { data: updatedCustomer, error } = await this.supabaseClient
      .from("customers")
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        company_name: data.companyName,
        tax_id: data.taxId,
        address: data.address,
        notes: data.notes,
        status: data.status,
        website: data.website,
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single()

    if (error) {
      console.error("[CustomersService] Update Error:", error)
      throw new Error("No se pudo actualizar el cliente.")
    }

    await auditLogService.logResourceUpdate(
      tenantId,
      'CUSTOMER',
      id,
      data
    )

    return this.mapToDomain(updatedCustomer)
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[CustomersService] Delete Error:", error)
      throw new Error("No se pudo eliminar el cliente.")
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
      console.error("[CustomersService] Restore Error:", error)
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
    
    const { data, error } = await this.supabaseClient
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Customer not found');
      throw error;
    }

    return this.mapToDomain(data);
  }

  async createCustomer(data: any) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for createCustomer");
    return this.create(data, tenantId);
  }

  async updateCustomer(id: string, data: any) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for updateCustomer");
    return this.update(id, data, tenantId);
  }

  async deleteCustomer(id: string) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for deleteCustomer");
    return this.delete(id, tenantId);
  }

  private mapToDomain(dbItem: DBCustomer): Customer {
    return fromDbCustomer(dbItem);
  }
}

// Exportamos la clase para inyección de dependencias
// En Server Actions se debe instanciar con el cliente de servidor.

// Singleton para uso en client-side – el tenantId se pasa por método
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@/lib/supabase/client')
export const customersService = new EnhancedCustomersService(createClient())

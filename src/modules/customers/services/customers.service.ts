import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"
import { Customer, CustomerFormValues } from "../types"
import { quotaEngine } from "@/core/quotas/engine"
import { auditLogService } from "@/core/security/audit.service"

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
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("[CustomersService] List Error:", error)
      throw new Error(`Error al listar clientes: ${error.message}`)
    }

    return {
      data: (data || []).map(this.mapToDomain),
      total: count || 0
    }
  }

  async create(data: CustomerFormValues, tenantId: string): Promise<Customer> {
    await quotaEngine.assertCanConsume(tenantId, "maxCustomers")

    const { data: newCustomer, error } = await this.supabaseClient
      .from("customers")
      .insert({
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || null,
        email: data.email,
        phone: data.phone || null,
        company_name: data.companyName || null,
        tax_id: data.taxId || null,
        address: data.address || null,
        notes: data.notes || null,
        status: data.status || "active",
        website: data.website || null,
        tenant_id: tenantId,
      })
      .select()
      .single()

    if (error) {
      console.error("[CustomersService] Create Error:", error)
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

  private mapToDomain(dbItem: DBCustomer): Customer {
    return {
      id: dbItem.id,
      firstName: dbItem.first_name || "",
      lastName: dbItem.last_name || "",
      email: dbItem.email,
      phone: dbItem.phone || "",
      companyName: dbItem.company_name || "",
      taxId: dbItem.tax_id || "",
      address: dbItem.address || "",
      notes: dbItem.notes || "",
      status: (dbItem.status as any) || "active",
      website: dbItem.website || "",
      createdAt: dbItem.created_at || undefined,
    }
  }
}

// Exportamos la clase para inyección de dependencias
// En Server Actions se debe instanciar con el cliente de servidor.

// Singleton para uso en client-side – el tenantId se pasa por método
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@/lib/supabase/client')
export const customersService = new EnhancedCustomersService(createClient())

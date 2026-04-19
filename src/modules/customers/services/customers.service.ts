import type { SupabaseClient } from "@supabase/supabase-js"

import { quotaEngine } from "@/core/quotas/engine"
import { AuditLogService } from "@/core/security/audit.service"
import { logger } from "@/lib/logger"
import { createClient } from '@/lib/supabase/client'
import type { Database } from "@/lib/supabase/database.types"

import type { ICustomerRepository } from "../interfaces/ICustomerRepository"
import { SupabaseCustomerRepository } from "../repositories/SupabaseCustomerRepository"
import type { Customer, CustomerFormValues } from "../types"




/**
 * CustomersService Wrapper con Lógica de Negocio Extendida
 */
export class EnhancedCustomersService {
  private audit: AuditLogService;
  private repository: ICustomerRepository;

  constructor(private supabaseClient: SupabaseClient<Database>, private tenantIdOverride?: string) {
    this.audit = new AuditLogService(supabaseClient);
    this.repository = new SupabaseCustomerRepository(supabaseClient);
  }

  async list(tenantId: string, page = 1, limit = 50): Promise<{ data: Customer[], total: number }> {
    try {
      const result = await this.repository.findAll(tenantId, {
        page,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      return {
        data: result.data,
        total: result.meta.total || 0
      }
    } catch (error) {
      logger.error("[CustomersService] List Error", { error })
      throw new Error("Error al listar clientes")
    }
  }

  async create(data: CustomerFormValues & { data_consent_at?: string; data_consent_ip?: string }, tenantId: string): Promise<Customer> {
    await quotaEngine.assertCanConsume(tenantId, "maxCustomers")

    try {
      const newCustomer = await this.repository.create({
        ...data,
      }, tenantId);

      await Promise.all([
        quotaEngine.incrementUsage(tenantId, "maxCustomers"),
        this.audit.logResourceCreate(
          tenantId,
          'CUSTOMER',
          newCustomer.id,
          newCustomer
        )
      ])

      return newCustomer;
    } catch (error) {
      logger.error("[CustomersService] Create Error", { error })
      throw new Error("No se pudo crear el cliente")
    }
  }

  async update(id: string, data: Partial<CustomerFormValues>, tenantId: string): Promise<Customer> {
    try {
      const updatedCustomer = await this.repository.update(id, data, tenantId);

      await this.audit.logResourceUpdate(
        tenantId,
        'CUSTOMER',
        id,
        data
      )

      return updatedCustomer;
    } catch (error) {
      logger.error("[CustomersService] Update Error", { error })
      throw new Error("No se pudo actualizar el cliente")
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await this.repository.delete(id, tenantId);

      await Promise.all([
        quotaEngine.decrementUsage(tenantId, "maxCustomers"),
        this.audit.logResourceDelete(tenantId, 'CUSTOMER', id)
      ])
    } catch (error) {
      logger.error("[CustomersService] Delete Error", { error })
      throw new Error("No se pudo eliminar el cliente")
    }
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

  async getCustomers(query: { tenant_id?: string; page?: number; limit?: number }) {
    return this.list(query.tenant_id || this.tenantIdOverride || '', query.page || 1, query.limit || 50);
  }

  async getCustomerById(id: string) {
    const tenantId = this.tenantIdOverride;
    if (!tenantId) throw new Error("Tenant ID required for getCustomerById");

    try {
      const customer = await this.repository.findById(id, tenantId);
      if (!customer) throw new Error('Customer not found');
      return customer;
    } catch (error) {
      logger.error("[CustomersService] GetById Error", { error })
      throw error;
    }
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

const defaultClient = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL)
  ? createClient()
  : undefined;

export const customersService = new EnhancedCustomersService(defaultClient!);

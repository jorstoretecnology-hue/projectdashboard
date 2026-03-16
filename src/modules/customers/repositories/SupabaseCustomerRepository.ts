import { SupabaseClient } from '@supabase/supabase-js';
import { ICustomerRepository } from '../interfaces/ICustomerRepository';
import { Customer } from '../types';
import { CreateCustomerDTO, UpdateCustomerDTO, CustomerQueryDTO } from '@/lib/api/schemas/customers';

/**
 * Implementación concreta del Repositorio de Clientes para Supabase
 * 
 * Esta clase encapsula toda la lógica específica de Supabase (RLS, filtros, queries).
 * Si en el futuro se cambia de base de datos, solo se necesita crear una nueva
 * implementación de ICustomerRepository sin tocar el servicio.
 */
export class SupabaseCustomerRepository implements ICustomerRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(tenantId: string, query: CustomerQueryDTO) {
    const { page, limit, search, status, city, sort_by, sort_order } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const CUSTOMER_FIELDS = 'id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, metadata, city, location_id, created_at, updated_at';

    let q = this.supabase
      .from('customers')
      .select(CUSTOMER_FIELDS, { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Búsqueda "Fuzzy" en múltiples campos
    if (search) {
      q = q.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,tax_id.ilike.%${search}%`
      );
    }

    if (status) {
      q = q.eq('status', status);
    }

    // TODO: Agregar columna city en migración futura o usar address
    if (city) {
      q = q.ilike('address', `%${city}%`);
    }

    q = q.order(sort_by, { ascending: sort_order === 'asc' });
    q = q.range(from, to);

    const { data, error, count } = await q;

    if (error) throw error;

    return {
      data: data as Customer[],
      meta: {
        page,
        limit,
        total: count,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    };
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const CUSTOMER_FIELDS = 'id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, metadata, city, location_id, created_at';

    const { data, error } = await this.supabase
      .from('customers')
      .select(CUSTOMER_FIELDS)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Customer;
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const CUSTOMER_FIELDS = 'id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, metadata, city, location_id, created_at';

    const { data, error } = await this.supabase
      .from('customers')
      .select(CUSTOMER_FIELDS)
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data as Customer | null;
  }

  async create(data: CreateCustomerDTO, tenantId: string): Promise<Customer> {
    const dbData = {
      ...data,
      tenant_id: tenantId,
    };

    const { data: newCustomer, error } = await this.supabase
      .from('customers')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return newCustomer as Customer;
  }

  async update(id: string, data: UpdateCustomerDTO, tenantId: string): Promise<Customer> {
    const { data: updated, error } = await this.supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return updated as Customer;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }
}

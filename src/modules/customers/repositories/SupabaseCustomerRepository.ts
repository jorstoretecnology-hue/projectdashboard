import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerQueryDTO} from '@/lib/api/schemas/customers';
import {
  fromDbCustomer,
  toDbCustomer,
} from '@/lib/api/schemas/customers';
import type { Database } from '@/lib/supabase/database.types';

import type { ICustomerRepository } from '../interfaces/ICustomerRepository';
import type { Customer } from '../types';

type DBCustomerInsert = Database['public']['Tables']['customers']['Insert'];
type DBCustomerUpdate = Database['public']['Tables']['customers']['Update'];

/**
 * Implementación concreta del Repositorio de Clientes para Supabase
 *
 * Esta clase encapsula toda la lógica específica de Supabase (RLS, filtros, queries).
 * Si en el futuro se cambia de base de datos, solo se necesita crear una nueva
 * implementación de ICustomerRepository sin tocar el servicio.
 */
export class SupabaseCustomerRepository implements ICustomerRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findAll(tenantId: string, query: CustomerQueryDTO) {
    const { page, limit, search, status, city, sortBy, sortOrder } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Campos exactos de la tabla customers
    const CUSTOMER_FIELDS =
      'id, tenant_id, first_name, last_name, name, email, phone, created_at, updated_at, metadata, deleted_at, location_id, identification_type, identification_number, city, company_name, tax_id, address, notes, status, website';

    let q = this.supabase
      .from('customers')
      .select(CUSTOMER_FIELDS, { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Búsqueda "Fuzzy" en múltiples campos
    if (search) {
      q = q.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,tax_id.ilike.%${search}%`,
      );
    }

    if (status) {
      q = q.eq('status', status);
    }

    // TODO: Agregar columna city en migración futura o usar address
    if (city) {
      q = q.ilike('address', `%${city}%`);
    }

    q = q.order(sortBy, { ascending: sortOrder === 'asc' });
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) throw error;

    // Usar helper centralizado para mapeo
    const customers = (data || []).map(
      (dbItem) => fromDbCustomer(dbItem as Parameters<typeof fromDbCustomer>[0]),
    )

    return {
      data: customers,
      meta: {
        page,
        limit,
        total: count,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    };
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const CUSTOMER_FIELDS =
      'id, tenant_id, first_name, last_name, name, email, phone, created_at, updated_at, metadata, deleted_at, location_id, identification_type, identification_number, city, company_name, tax_id, address, notes, status, website';

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

    return fromDbCustomer(data as Record<string, unknown>);
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const CUSTOMER_FIELDS =
      'id, tenant_id, first_name, last_name, name, email, phone, created_at, updated_at, metadata, deleted_at, location_id, identification_type, identification_number, city, company_name, tax_id, address, notes, status, website';

    const { data, error } = await this.supabase
      .from('customers')
      .select(CUSTOMER_FIELDS)
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return fromDbCustomer(data as Record<string, unknown>);
  }

  async create(data: CreateCustomerDTO & { data_consent_at?: string; data_consent_ip?: string; }, tenantId: string): Promise<Customer> {
    // Convertir de camelCase (frontend) a snake_case (database)
    const dbData = {
      ...toDbCustomer({ ...data, tenant_id: tenantId }),
      tenant_id: tenantId,
    };

    const { data: newCustomer, error } = await this.supabase
      .from('customers')
      .insert(dbData as DBCustomerInsert)
      .select(
        'id, tenant_id, first_name, last_name, name, email, phone, created_at, updated_at, metadata, deleted_at, location_id, identification_type, identification_number, city, company_name, tax_id, address, notes, status, website',
      )
      .single();

    if (error) throw error;

    return fromDbCustomer(newCustomer);
  }

  async update(id: string, data: UpdateCustomerDTO, tenantId: string): Promise<Customer> {
    // Convertir de camelCase (frontend) a snake_case (database)
    const dbData = toDbCustomer({ ...data, tenant_id: tenantId } as CreateCustomerDTO & { tenant_id: string });

    const { data: updated, error } = await this.supabase
      .from('customers')
      .update(dbData as DBCustomerUpdate)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(
        'id, tenant_id, first_name, last_name, name, email, phone, created_at, updated_at, metadata, deleted_at, location_id, identification_type, identification_number, city, company_name, tax_id, address, notes, status, website',
      )
      .single();

    if (error) throw error;

    return fromDbCustomer(updated);
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

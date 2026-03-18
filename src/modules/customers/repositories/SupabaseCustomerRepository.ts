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
    const { page, limit, search, status, city, sortBy, sortOrder } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // metadata no existe en la tabla customers - usar solo campos existentes
    const CUSTOMER_FIELDS = 'id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, city, location_id, created_at, updated_at';

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

    q = q.order(sortBy, { ascending: sortOrder === 'asc' });
    q = q.range(from, to);

    const { data, error, count } = await q;

    if (error) throw error;

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
      locationId: dbItem.location_id,
      status: dbItem.status ?? 'active',
      notes: dbItem.notes ?? '',
      website: dbItem.website ?? '',
      metadata: {}, // metadata no existe en DB
      createdAt: dbItem.created_at ?? undefined,
      updatedAt: dbItem.updated_at ?? undefined,
    }));

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
    // metadata no existe en la tabla customers
    const CUSTOMER_FIELDS = 'id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, city, location_id, created_at';

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

    // Convertir de snake_case (DB) a camelCase (domain) con valores default
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

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    // city y metadata no existen en la tabla customers
    const CUSTOMER_FIELDS = 'id, first_name, last_name, name, email, phone, company_name, tax_id, address, notes, status, website, location_id, created_at';

    const { data, error } = await this.supabase
      .from('customers')
      .select(CUSTOMER_FIELDS)
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    // Convertir de snake_case (DB) a camelCase (domain) con valores default
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

  async create(data: CreateCustomerDTO, tenantId: string): Promise<Customer> {
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

    const { data: newCustomer, error } = await this.supabase
      .from('customers')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    // Convertir de snake_case (DB) a camelCase (domain) con valores default
    const dbItem = newCustomer as any;
    return {
      ...data,
      id: dbItem.id,
      identificationType: dbItem.identification_type ?? 'CC',
      identificationNumber: dbItem.identification_number ?? '',
      city: dbItem.city ?? data.city ?? '',
      metadata: {}, // metadata no existe en DB
      createdAt: dbItem.created_at ?? undefined,
      updatedAt: dbItem.updated_at ?? undefined,
    };
  }

  async update(id: string, data: UpdateCustomerDTO, tenantId: string): Promise<Customer> {
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

    const { data: updated, error } = await this.supabase
      .from('customers')
      .update(dbData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    // Convertir de snake_case (DB) a camelCase (domain) con valores default
    const dbItem = updated as any;
    return {
      ...data,
      id: dbItem.id,
      firstName: dbItem.first_name ?? data.firstName ?? '',
      lastName: dbItem.last_name ?? data.lastName ?? '',
      email: dbItem.email,
      phone: dbItem.phone ?? '',
      companyName: dbItem.company_name ?? '',
      taxId: dbItem.tax_id ?? '',
      identificationType: dbItem.identification_type ?? 'CC',
      identificationNumber: dbItem.identification_number ?? '',
      address: dbItem.address ?? '',
      city: dbItem.city ?? data.city ?? '',
      locationId: dbItem.location_id,
      status: dbItem.status ?? 'active',
      notes: dbItem.notes ?? '',
      website: dbItem.website ?? '',
      metadata: {}, // metadata no existe en DB
      createdAt: dbItem.created_at ?? undefined,
      updatedAt: dbItem.updated_at ?? undefined,
    } as Customer;
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

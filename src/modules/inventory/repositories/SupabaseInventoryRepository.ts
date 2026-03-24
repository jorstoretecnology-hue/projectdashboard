import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { IInventoryRepository } from "../interfaces/IInventoryRepository";
import { InventoryItem } from "../types";
import { CreateProductDTO, UpdateProductDTO, ProductQueryDTO } from "@/lib/api/schemas/products";

type DBProduct = Database['public']['Tables']['products']['Row'];

export class SupabaseInventoryRepository implements IInventoryRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findAll(tenantId: string, query: ProductQueryDTO) {
    let supabaseQuery = this.supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (query.search) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query.search}%,sku.ilike.%${query.search}%`);
    }

    if (query.industry_type) {
      supabaseQuery = supabaseQuery.eq('industry_type', query.industry_type);
    }

    if (query.category_id) {
       // El campo en products es category (string) o category_id? 
       // Según migration 1 fue category VARCHAR(100). Según schema products es category.
       // Dejaremos category por ahora hasta unificar.
    }

    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    const { data, error, count } = await supabaseQuery
      .order(query.sort_by, { ascending: query.sort_order === 'asc' })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data || []).map(this.mapToDomain),
      meta: {
        page: query.page,
        limit: query.limit,
        total: count,
        total_pages: Math.ceil((count || 0) / query.limit),
      },
    };
  }

  async findById(id: string, tenantId: string): Promise<InventoryItem | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return this.mapToDomain(data);
  }

  async findBySku(sku: string, tenantId: string): Promise<InventoryItem | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return this.mapToDomain(data);
  }

  async create(data: CreateProductDTO, tenantId: string): Promise<InventoryItem> {
    const { data: newProduct, error } = await this.supabase
      .from('products')
      .insert({
        ...data,
        tenant_id: tenantId,
      } as any) // Cast as any because of possible field mismatches during sync
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(newProduct);
  }

  async update(id: string, data: UpdateProductDTO, tenantId: string): Promise<InventoryItem> {
    const { data: updatedProduct, error } = await this.supabase
      .from('products')
      .update(data as any)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(updatedProduct);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  private mapToDomain(dbProduct: DBProduct): InventoryItem {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || '',
      type: (dbProduct as any).type || 'product', // 'type' was added in Phase 9
      productKind: 'simple',
      category: (dbProduct as any).category || 'General',
      price: Number(dbProduct.price),
      stock: Number(dbProduct.stock),
      sku: dbProduct.sku || undefined,
      images: dbProduct.image ? [dbProduct.image] : [],
      metadata: (dbProduct.metadata as Record<string, unknown>) || {},
      createdAt: dbProduct.created_at || undefined,
    };
  }
}

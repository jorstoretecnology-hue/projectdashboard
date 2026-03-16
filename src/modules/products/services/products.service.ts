import { SupabaseClient } from '@supabase/supabase-js';
import { CreateProductDTO, UpdateProductDTO, ProductQueryDTO } from '@/lib/api/schemas/products';
import { apiError } from '@/lib/api/response';

export class ProductsService {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string
  ) {}

  private readonly PRODUCT_FIELDS = 'id, tenant_id, name, description, price, stock, category, sku, image, industry_type, metadata, state, category_id, created_at, updated_at';

  /**
   * Listar productos con filtros y paginación
   */
  async getProducts(query: ProductQueryDTO) {
    const { page, limit, search, state, category_id, sort_by, sort_order } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase
      .from('products')
      .select(this.PRODUCT_FIELDS, { count: 'exact' })
      .eq('tenant_id', this.tenantId);

    // Filtros dinámicos
    if (search) {
      q = q.ilike('name', `%${search}%`);
    }
    if (state) {
      q = q.eq('state', state);
    }
    if (category_id) {
      q = q.eq('category_id', category_id);
    }

    // Ordenamiento
    q = q.order(sort_by, { ascending: sort_order === 'asc' });

    // Paginación
    q = q.range(from, to);

    const { data, error, count } = await q;

    if (error) throw error;

    return {
      data,
      meta: {
        page,
        limit,
        total: count,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    };
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(id: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(this.PRODUCT_FIELDS)
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Product not found'); // Manejado como 404
      }
      throw error;
    }
    return data;
  }

  /**
   * Crear producto
   * El trigger de base de datos 'update_product_state' se encargará del estado inicial
   */
  async createProduct(data: CreateProductDTO) {
    // Validar nombre único? (Opcional, podría ser por SKU)
    if (data.sku) {
       const existing = await this.supabase
         .from('products')
         .select('id')
         .eq('tenant_id', this.tenantId)
         .eq('sku', data.sku)
         .single();
       
       if (existing.data) {
         throw new Error(`Product with SKU ${data.sku} already exists`);
       }
    }

    const { data: newProduct, error } = await this.supabase
      .from('products')
      .insert({
        ...data,
        tenant_id: this.tenantId,
        // state se calcula automáticamente por trigger o default
      })
      .select()
      .single();

    if (error) throw error;
    return newProduct;
  }

  /**
   * Actualizar producto
   */
  async updateProduct(id: string, data: UpdateProductDTO) {
    // Verificar existencia
    await this.getProductById(id);

    const { data: updatedProduct, error } = await this.supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .select()
      .single();

    if (error) throw error;
    return updatedProduct;
  }

  /**
   * Eliminar producto (Soft Delete recomendado, pero aquí hacemos hard delete por ahora según schema)
   * TODO: Implementar soft delete real si agregamos 'deleted_at'
   */
  async deleteProduct(id: string) {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', this.tenantId);

    if (error) throw error;
    return { success: true };
  }
}

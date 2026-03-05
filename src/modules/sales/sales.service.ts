import { SupabaseClient } from '@supabase/supabase-js';
import { CreateSaleDTO, SaleQueryDTO } from '@/lib/api/schemas/sales';

export class SalesService {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string
  ) {}

  /**
   * Crear venta transaccional via RPC
   */
  async createSaleTransaction(data: CreateSaleDTO, userId: string) {
    // Preparar payload para RPC
    // RPC signature: (p_tenant_id, p_user_id, p_customer_id, p_payment_method, p_discount, p_tax_rate, p_notes, p_items)
    
    const { data: result, error } = await this.supabase.rpc('create_sale_transaction', {
      p_tenant_id: this.tenantId,
      p_user_id: userId,
      p_customer_id: data.customer_id,
      p_payment_method: data.payment_method,
      p_discount: data.discount,
      p_tax_rate: data.tax_rate,
      p_notes: data.notes || null,
      p_items: data.items, // JSONB array of items
      p_metadata: data.metadata || {},
    });

    if (error) {
      console.error('[SalesService] RPC Error:', error);
      // Intentar extraer mensaje de error de Postgres (P0001 Raise Exception)
      if (error.code === 'P0001' || error.message.includes('Stock insuficiente')) {
        throw new Error(error.message); // Propagar como error de negocio (409/400 manejado por wrapper)
      }
      throw error;
    }

    return result;
  }

  /**
   * Listar ventas (History)
   */
  async getSales(query: SaleQueryDTO) {
    const { page, limit, start_date, end_date, state, customer_id, sort_by, sort_order } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase
      .from('sales')
      .select('*, customer:customers(first_name, last_name, company_name), creator:created_by(email)', { count: 'exact' })
      .eq('tenant_id', this.tenantId);

    if (state) q = q.eq('state', state);
    if (customer_id) q = q.eq('customer_id', customer_id);
    if (start_date) q = q.gte('created_at', start_date);
    if (end_date) q = q.lte('created_at', end_date);
    
    // Sort
    q = q.order(sort_by, { ascending: sort_order === 'asc' });
    
    // Paginate
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
   * Obtener detalle venta
   */
  async getSaleById(id: string) {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*, items:sale_items(*), customer:customers(*)')
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Sale not found');
      throw error;
    }
    return data;
  }
}

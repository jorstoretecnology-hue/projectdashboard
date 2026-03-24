import { SupabaseClient } from '@supabase/supabase-js';
import { 
  CreatePurchaseDTO, 
  PurchaseQueryDTO, 
  CreateSupplierDTO, 
  SupplierQueryDTO 
} from '../../../lib/api/schemas/purchases';

export class PurchasesService {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string
  ) {}

  // -----------------------------------------------------
  // Suppliers Methods
  // -----------------------------------------------------
  async getSuppliers(query: SupplierQueryDTO) {
    const { page, limit, search } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenantId);

    if (search) {
      q = q.ilike('name', `%${search}%`);
    }

    q = q.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await q;
    if (error) throw error;

    return { data, meta: { page, limit, total: count } };
  }

  async createSupplier(data: CreateSupplierDTO) {
    const { data: newSupplier, error } = await this.supabase
      .from('suppliers')
      .insert({ ...data, tenant_id: this.tenantId })
      .select('id, name, email, phone, contact_person, created_at')
      .single();

    if (error) throw error;
    return newSupplier;
  }

  // -----------------------------------------------------
  // Purchases Methods
  // -----------------------------------------------------
  async getPurchases(query: PurchaseQueryDTO) {
    const { page, limit, state, supplier_id, start_date, end_date, sort_by, sort_order } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase
      .from('purchase_orders')
      // Ajuste: si supplier_id es UUID en DB, join con suppliers. Si es string legacy, lo manejamos.
      // Migración 04 agregó supplier_id UUID.
      .select('*, supplier:suppliers(name, email), items:purchase_order_items(count)', { count: 'exact' })
      .eq('tenant_id', this.tenantId);

    if (state) q = q.eq('state', state);
    if (supplier_id) q = q.eq('supplier_id', supplier_id);
    if (start_date) q = q.gte('created_at', start_date);
    if (end_date) q = q.lte('created_at', end_date);

    q = q.order(sort_by, { ascending: sort_order === 'asc' });
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) throw error;

    return { data, meta: { page, limit, total: count } };
  }

  async getPurchaseById(id: string) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('*, items:purchase_order_items(*), supplier:suppliers(*)')
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Purchase Order not found');
      throw error;
    }
    return data;
  }

  async createPurchase(data: CreatePurchaseDTO, userId: string) {
    // Call atomic RPC
    const { data: po, error } = await this.supabase.rpc('create_purchase_transaction', {
      p_tenant_id: this.tenantId,
      p_user_id: userId,
      p_supplier_id: data.supplier_id,
      p_delivery_date: data.expected_date || new Date().toISOString(),
      p_notes: data.notes || '',
      p_items: data.items.map(item => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity,
        unit_cost: item.unit_cost
      }))
    });

    if (error) throw error;
    return po;
  }

  async receivePurchase(id: string, userId: string, items: { product_id: string, quantity_received: number }[], notes?: string) {
    // Call RPC with new signature supporting partial items
    const { data, error } = await this.supabase.rpc('receive_purchase_transaction', {
      p_purchase_id: id,
      p_tenant_id: this.tenantId,
      p_user_id: userId,
      p_items: items, // Passed as JSONB
      p_notes: notes || ''
    });

    if (error) {
       // Propagar errores de negocio del RPC
       if (error.message.includes('ya se encuentra en estado final')) {
          throw new Error(error.message);
       }
       throw error;
    }

    return data;
  }
}

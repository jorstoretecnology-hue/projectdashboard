import { SupabaseClient } from '@supabase/supabase-js';
import { 
  CreateVehicleDTO, 
  UpdateVehicleDTO, 
  VehicleQueryDTO,
  CreateServiceOrderDTO,
  UpdateServiceOrderDTO,
  CreateServiceItemDTO,
  ServiceQueryDTO
} from '@/lib/api/schemas/services';

export class ServicesService {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string
  ) {}

  // -----------------------------------------------------
  // Vehicles Methods
  // -----------------------------------------------------
  async getVehicles(query: VehicleQueryDTO) {
    const { page, limit, search, customer_id } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase
      .from('vehicles')
      .select('*, customer:customers(first_name, last_name, email)', { count: 'exact' })
      .eq('tenant_id', this.tenantId);

    if (search) {
      q = q.or(`plate.ilike.%${search}%,model.ilike.%${search}%`);
    }
    if (customer_id) q = q.eq('customer_id', customer_id);

    q = q.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await q;
    if (error) throw error;

    return { data, meta: { page, limit, total: count } };
  }

  async createVehicle(data: CreateVehicleDTO) {
    // Validar placa única
    const { data: existing } = await this.supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', this.tenantId)
      .eq('plate', data.plate)
      .single();
    
    if (existing) throw new Error(`Vehicle with plate ${data.plate} already exists`);

    const { data: vehicle, error } = await this.supabase
      .from('vehicles')
      .insert({ ...data, tenant_id: this.tenantId })
      .select()
      .single();

    if (error) throw error;
    return vehicle;
  }

  // -----------------------------------------------------
  // Service Orders Methods
  // -----------------------------------------------------
  async getServiceOrders(query: ServiceQueryDTO) {
    const { page, limit, state, customer_id, vehicle_id, sort_by, sort_order } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase
      .from('services')
      .select('*, vehicle:vehicles(plate, brand, model), customer:customers(first_name, last_name)', { count: 'exact' })
      .eq('tenant_id', this.tenantId);

    if (state) q = q.eq('state', state);
    if (customer_id) q = q.eq('customer_id', customer_id);
    if (vehicle_id) q = q.eq('vehicle_id', vehicle_id);

    q = q.order(sort_by, { ascending: sort_order === 'asc' });
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) throw error;

    return { data, meta: { page, limit, total: count } };
  }

  async getServiceOrderById(id: string) {
    const { data, error } = await this.supabase
      .from('services')
      .select('*, items:service_items(*), vehicle:vehicles(*), customer:customers(*)')
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Service Order not found');
      throw error;
    }
    return data;
  }

  async createServiceOrder(data: CreateServiceOrderDTO, userId: string) {
    const { data: service, error } = await this.supabase
      .from('services')
      .insert({
        tenant_id: this.tenantId,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        priority: data.priority,
        description: data.description,
        created_by: userId,
        state: 'RECIBIDO'
      })
      .select()
      .single();

    if (error) throw error;
    return service;
  }

  async addServiceItem(serviceId: string, data: CreateServiceItemDTO) {
    // Calcular subtotal
    const subtotal = data.quantity * data.unit_price;

    const { data: item, error } = await this.supabase
      .from('service_items')
      .insert({
        service_id: serviceId, // RLS validará propiedad del service
        product_id: data.product_id,
        description: data.description,
        item_type: data.item_type,
        quantity: data.quantity,
        unit_price: data.unit_price,
        subtotal
      })
      .select()
      .single();

    if (error) throw error;
    return item;
  }

  async completeService(id: string, userId: string, newState: 'REPARADO' | 'ENTREGADO') {
    const { data, error } = await this.supabase.rpc('complete_service_transaction', {
      p_service_id: id,
      p_tenant_id: this.tenantId,
      p_user_id: userId,
      p_new_state: newState
    });

    if (error) {
       if (error.message.includes('Stock insuficiente')) throw new Error(error.message);
       throw error;
    }
    return data;
  }
}

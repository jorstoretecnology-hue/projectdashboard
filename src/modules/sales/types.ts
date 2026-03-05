export type SaleState = 
  | 'COTIZACION' 
  | 'PENDIENTE' 
  | 'EN_PROCESO'
  | 'PAGADO' 
  | 'ENTREGADO' 
  | 'RECHAZADO' 
  | 'CANCELADA';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  discount: number;
  notes: string | null;
}

export interface Sale {
  id: string;
  tenant_id: string;
  customer_id: string;
  created_by: string;
  state: SaleState;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Joins
  items?: SaleItem[];
  customer?: {
    first_name: string;
    last_name: string;
    company_name: string | null;
  };
  creator?: {
    email: string;
  };
}

export interface CreateSaleItemDTO {
  product_id: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
  notes?: string;
}

export interface CreateSaleDTO {
  customer_id: string;
  payment_method: PaymentMethod;
  items: CreateSaleItemDTO[];
  discount?: number;
  tax_rate?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface SaleQuery {
  page?: number;
  limit?: number;
  state?: SaleState;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'created_at' | 'total' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

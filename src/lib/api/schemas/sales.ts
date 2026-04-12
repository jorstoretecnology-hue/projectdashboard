import { z } from 'zod';

// Enums
export const SaleStateEnum = z.enum([
  'COTIZACION',
  'PENDIENTE',
  'EN_PROCESO',
  'PAGADO',
  'ENTREGADO',
  'RECHAZADO',
  'CANCELADA'
]);

export const PaymentMethodEnum = z.enum([
  'CASH',
  'CARD',
  'TRANSFER',
  'OTHER'
]);

// Item Schema
export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  // Opcional: permitir override de precio. Si no se envía, backend usa precio actual del producto.
  unit_price: z.number().int().positive().optional(),
  discount: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

// Create Sale Schema
export const createSaleSchema = z.object({
  customer_id: z.string().uuid(),
  payment_method: PaymentMethodEnum.default('CASH'),
  items: z.array(saleItemSchema).min(1, 'Debe haber al menos un producto en la venta'),
  discount: z.number().int().nonnegative().default(0),
  tax_rate: z.number().int().nonnegative().max(100).default(0), // Percentage (e.g. 19)
  notes: z.string().optional(),

  // Metadata (e.g. mesa, zona, etc)
  metadata: z.record(z.string(), z.any()).default({}),
});

// Query Schema
export const saleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  state: SaleStateEnum.optional(),
  customer_id: z.string().uuid().optional(),
  min_total: z.coerce.number().optional(),
  max_total: z.coerce.number().optional(),
  sort_by: z.enum(['created_at', 'total', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSaleDTO = z.infer<typeof createSaleSchema>;
export type SaleItemDTO = z.infer<typeof saleItemSchema>;
export type SaleQueryDTO = z.infer<typeof saleQuerySchema>;

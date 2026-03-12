import { z } from 'zod';

// Enums
export const PurchaseStateEnum = z.enum([
  'BORRADOR',
  'ENVIADA',
  'CONFIRMADA',
  'RECIBIDA_PARCIAL',
  'RECIBIDA_COMPLETA',
  'RECHAZADA'
]);

// -----------------------------------------------------
// Suppliers Schemas
// -----------------------------------------------------
export const createSupplierSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  contact_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  tax_id: z.string().optional(), // NIT, RUC
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

// -----------------------------------------------------
// Purchases Schemas
// -----------------------------------------------------
export const purchaseItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_cost: z.number().nonnegative(), // Costo unitario acordado
});

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid(),
  expected_date: z.string().datetime().optional(), // ISO date
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'Debe incluir al menos un producto'),
});

export const receivePurchaseSchema = z.object({
  notes: z.string().optional(),
});

export const purchaseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  state: PurchaseStateEnum.optional(),
  supplier_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'expected_date', 'total']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type CreateSupplierDTO = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDTO = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryDTO = z.infer<typeof supplierQuerySchema>;
export type CreatePurchaseDTO = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseQueryDTO = z.infer<typeof purchaseQuerySchema>;

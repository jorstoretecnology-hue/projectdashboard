import { z } from 'zod';

// Enums alineados con la base de datos y tipos
export const ProductStateEnum = z.enum([
  'DISPONIBLE',
  'BAJO_STOCK',
  'AGOTADO',
  'CRITICO',
  'BLOQUEADO',
]);

export const IndustryTypeEnum = z.enum([
  'taller',
  'restaurante',
  'supermercado',
  'ferreteria',
  'gym',
  'glamping',
  'discoteca',
]);

// Schema para crear productos
export const createProductSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  threshold_low: z.number().int().min(1).default(10),
  threshold_critical: z.number().int().min(1).default(3),
  // Campos opcionales
  sku: z.string().optional(),
  category_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
  bar_code: z.string().optional(),
  
  // Metadata flexible para industrias
  industry_type: IndustryTypeEnum,
  metadata: z.record(z.unknown()).default({}),
});

// Schema para actualizar productos (Partial)
export const updateProductSchema = createProductSchema.partial().extend({
  is_blocked: z.boolean().optional(),
  blocked_reason: z.string().optional(),
  // Admin only: forzar estado manual (no recomendado, pero posible)
  state: ProductStateEnum.optional(),
});

// Schema para filtros y búsqueda (Query Params)
export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  state: ProductStateEnum.optional(),
  category_id: z.string().uuid().optional(),
  industry_type: IndustryTypeEnum.optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  sort_by: z.enum(['created_at', 'price', 'stock', 'name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Tipos inferidos
export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;
export type ProductQueryDTO = z.infer<typeof productQuerySchema>;

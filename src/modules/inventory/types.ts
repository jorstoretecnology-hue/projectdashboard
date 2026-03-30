import { z } from "zod"
import { InventoryItemType, ProductKind } from "@/config/inventory"
import { IndustryTypeEnum } from "@/lib/api/schemas/products"

/**
 * Esquema de Validación (Zod)
 * Contrato de datos para el formulario y validación de entrada
 */
export const inventoryItemSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  type: z.enum(["product", "service", "room", "membership"] as const),
  industry_type: IndustryTypeEnum,
  category: z.string().min(1, "La categoría es requerida"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  cost_price: z.number().min(0, "El costo no puede ser negativo").optional(),
  stock: z.number().int().min(0, "El stock no puede ser negativo").default(0),
  sku: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type InventoryFormValues = z.infer<typeof inventoryItemSchema>

/**
 * Modelo de Dominio de Inventario
 * Sincronizado con Database['public']['Tables']['products']['Row']
 */
export interface InventoryItem {
  id: string
  tenant_id: string
  name: string
  description: string | null
  type: InventoryItemType | string | null
  industry_type: string
  category: string
  price: number
  stock: number | null
  sku: string | null
  image: string | null
  images?: string[] // Soporte para múltiples imágenes si se expande
  metadata: Record<string, unknown>
  state: string | null
  is_blocked: boolean | null
  threshold_low: number | null
  threshold_critical: number | null
  createdAt?: string | null
  updatedAt?: string | null
}


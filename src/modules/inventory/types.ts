import { z } from "zod"
import { InventoryItemType, ProductKind } from "@/config/inventory"

/**
 * Esquema de Validación (Zod)
 * Contrato de datos para el formulario y validación de entrada
 */
export const inventoryItemSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  type: z.enum(["product", "service", "room", "membership"] as const),
  price: z.number().min(0, "El precio no puede ser negativo"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  sku: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(), // ✨ Permitir metadata dinámica por industria
})

export type InventoryFormValues = z.infer<typeof inventoryItemSchema>

/**
 * Modelo de Dominio de Inventario
 */
export interface InventoryItem {
  id: string
  name: string
  description: string
  type: InventoryItemType
  productKind: ProductKind
  category: string
  price: number
  stock: number
  sku?: string
  image?: string
  metadata?: Record<string, any> // ✨ Campos específicos de la industria
  createdAt?: string
}

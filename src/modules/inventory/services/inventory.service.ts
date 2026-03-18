import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"
import { InventoryFormValues, InventoryItem } from "../types"
import { quotaEngine } from "@/core/quotas/engine"
import { auditLogService } from "@/core/security/audit.service"
import { logger } from "@/lib/logger"

type DBInventoryItem = Database['public']['Tables']['inventory_items']['Row']

/**
 * InventoryService
 * -----------------
 * Encapsula toda la lógica de interacción con Supabase para el módulo de inventario.
 */
export class InventoryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Crea un nuevo ítem de inventario.
   */
  async create(data: InventoryFormValues, tenantId: string): Promise<InventoryItem> {
    await quotaEngine.assertCanConsume(tenantId, "maxInventoryItems")

    const { data: newItem, error } = await this.supabase
      .from("inventory_items")
      .insert({
        name: data.name,
        description: data.description || null,
        type: data.type,
        price: data.price,
        stock: data.stock,
        sku: data.sku || null,
        tenant_id: tenantId, 
        images: [] // ✨ Inicializar array vacio
      })
      .select()
      .single()

    if (error) {
      logger.error("[InventoryService] Error:", error)
      throw new Error("Error en operación de inventario.")
    }

    await Promise.all([
      quotaEngine.incrementUsage(tenantId, "maxInventoryItems"),
      auditLogService.logResourceCreate(
        tenantId, 
        'INVENTORY', 
        newItem.id, 
        newItem
      )
    ])

    return this.mapToDomain(newItem)
  }

  /**
   * Actualiza un ítem de inventario existente.
   */
  async update(id: string, data: Partial<InventoryFormValues>, tenantId: string): Promise<InventoryItem> {
    const { data: updatedItem, error } = await this.supabase
      .from("inventory_items")
      .update({
        name: data.name,
        description: data.description,
        type: data.type,
        price: data.price,
        stock: data.stock,
        sku: data.sku,
        images: (data as any).images, // ✨ Permitir actualización de imágenes
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single()

    if (error) {
      console.error("[InventoryService] Update Error:", error)
      throw new Error("No se pudo actualizar el ítem de inventario.")
    }

    await auditLogService.logResourceUpdate(
      tenantId,
      'INVENTORY',
      id,
      data
    )

    return this.mapToDomain(updatedItem)
  }

  /**
   * Elimina un ítem de inventario (Borrado Lógico vía Trigger).
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from("inventory_items")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[InventoryService] Delete Error:", error)
      throw new Error("No se pudo eliminar el ítem de inventario.")
    }

    await Promise.all([
      quotaEngine.decrementUsage(tenantId, "maxInventoryItems"),
      auditLogService.logResourceDelete(tenantId, 'INVENTORY', id)
    ])
  }

  /**
   * Restaura un ítem de inventario previamente eliminado.
   */
  async restore(id: string, tenantId: string): Promise<void> {
    // Usamos el RPC custom 'restore_record' para bypass RLS de forma segura
    const { error } = await this.supabase.rpc('restore_record', {
      target_table: 'inventory_items',
      record_id: id,
      target_tenant_id: tenantId
    })

    if (error) {
      console.error("[InventoryService] Restore Error:", error)
      throw new Error("No se pudo restaurar el ítem de inventario.")
    }

    await quotaEngine.incrementUsage(tenantId, "maxInventoryItems")
  }

  /**
   * Obtiene una lista paginada de ítems.
   */
  async list(tenantId: string, page = 1, limit = 50): Promise<{ data: InventoryItem[], total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await this.supabase
      .from("inventory_items")
      .select("id, name, description, type, price, stock, sku, tenant_id, metadata, created_at, updated_at, deleted_at, location_id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("[InventoryService] List Error:", error)
      throw new Error(`Error al listar inventario: ${error.message}`)
    }

    return {
      data: (data || []).map(this.mapToDomain),
      total: count || 0
    }
  }

  /**
   * Mapper: DB -> Domain
   */
  private mapToDomain(dbItem: DBInventoryItem): InventoryItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      description: dbItem.description || "",
      type: dbItem.type as any, // Mapeo temporal hasta unificar tipos de config
      productKind: "simple", // Valor por defecto
      category: "General",
      price: Number(dbItem.price),
      stock: Number(dbItem.stock),
      sku: dbItem.sku || undefined,
      images: (dbItem as any).images || [], // ✨ Mapear array de imágenes
      createdAt: dbItem.created_at || undefined,
    }
  }
}

// Exportamos la clase para inyección de dependencias
// En Server Actions se debe instanciar con el cliente de servidor.

// Singleton para uso en client-side – el tenantId se pasa por método
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@/lib/supabase/client')
export const inventoryService = new InventoryService(createClient())

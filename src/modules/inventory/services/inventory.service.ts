import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"
import { InventoryFormValues, InventoryItem } from "../types"
import { quotaEngine } from "@/core/quotas/engine"
import { AuditLogService } from "@/core/security/audit.service"
import { logger } from "@/lib/logger"
import { IInventoryRepository } from "../interfaces/IInventoryRepository"
import { SupabaseInventoryRepository } from "../repositories/SupabaseInventoryRepository"
import { CreateProductDTO, ProductQueryDTO } from "@/lib/api/schemas/products"

/**
 * EnhancedInventoryService
 * ------------------------
 * Maneja el stock y catálogo de productos utilizando el patrón Repository.
 * Unificado con la tabla 'products' según consolidación de Fase 9.
 */
export class InventoryService {
  private audit: AuditLogService;
  private repository: IInventoryRepository;

  constructor(private supabase: SupabaseClient<Database>) {
    this.audit = new AuditLogService(supabase);
    this.repository = new SupabaseInventoryRepository(supabase);
  }

  /**
   * Crea un nuevo ítem de inventario (Producto).
   */
  async create(data: InventoryFormValues, tenantId: string): Promise<InventoryItem> {
    await quotaEngine.assertCanConsume(tenantId, "maxInventoryItems")

    try {
      // Mapeo de InventoryFormValues a CreateProductDTO
      const productData: CreateProductDTO & { category: string } = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        sku: data.sku,
        industry_type: data.industry_type,
        category: data.category,
        metadata: data.metadata || {},
        threshold_low: 10,
        threshold_critical: 3
      };


      const newItem = await this.repository.create(productData, tenantId);

      await Promise.all([
        quotaEngine.incrementUsage(tenantId, "maxInventoryItems"),
        this.audit.logResourceCreate(
          tenantId, 
          'INVENTORY', 
          newItem.id, 
          newItem
        )
      ])

      return newItem;
    } catch (error) {
      logger.error("[InventoryService] Create Error:", error)
      throw new Error("No se pudo crear el ítem de inventario.")
    }
  }

  /**
   * Actualiza un ítem de inventario existente.
   */
  async update(id: string, data: Partial<InventoryFormValues>, tenantId: string): Promise<InventoryItem> {
    try {
      const updatedItem = await this.repository.update(id, data as any, tenantId);

      await this.audit.logResourceUpdate(
        tenantId,
        'INVENTORY',
        id,
        data
      )

      return updatedItem;
    } catch (error) {
      logger.error("[InventoryService] Update Error:", error)
      throw new Error("No se pudo actualizar el ítem de inventario.")
    }
  }

  /**
   * Eliminar un ítem de inventario (Borrado Lógico vía Trigger).
   */
  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await this.repository.delete(id, tenantId);

      await Promise.all([
        quotaEngine.decrementUsage(tenantId, "maxInventoryItems"),
        this.audit.logResourceDelete(tenantId, 'INVENTORY', id)
      ])
    } catch (error) {
      logger.error("[InventoryService] Delete Error:", error)
      throw new Error("No se pudo eliminar el ítem de inventario.")
    }
  }

  /**
   * Restaurar un ítem de inventario previamente eliminado.
   */
  async restore(id: string, tenantId: string): Promise<void> {
    try {
      // El repositorio maneja la restauración vía RPC custom 'restore_record'
      const { error } = await this.supabase.rpc('restore_record', {
        target_table: 'products', // ✨ Corregido a 'products'
        record_id: id,
        target_tenant_id: tenantId
      });

      if (error) throw error;

      await quotaEngine.incrementUsage(tenantId, "maxInventoryItems")
    } catch (error) {
      logger.error("[InventoryService] Restore Error:", error)
      throw new Error("No se pudo restaurar el ítem de inventario.")
    }
  }

  /**
   * Obtiene una lista paginada de ítems.
   */
  async list(tenantId: string, page = 1, limit = 50): Promise<{ data: InventoryItem[], total: number }> {
    try {
      const query: ProductQueryDTO = {
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const result = await this.repository.findAll(tenantId, query);

      return {
        data: result.data,
        total: result.meta.total || 0
      }
    } catch (error) {
      logger.error("[InventoryService] List Error:", error)
      throw new Error("Error al listar el inventario.")
    }
  }
}

// Exportamos la clase para inyección de dependencias
const defaultClient = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL)
  ? createClient()
  : undefined;

export const inventoryService = new InventoryService(defaultClient!);

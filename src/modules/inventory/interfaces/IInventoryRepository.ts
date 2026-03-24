import { InventoryItem } from '../types';
import { CreateProductDTO, UpdateProductDTO, ProductQueryDTO } from '@/lib/api/schemas/products';

/**
 * Interfaz del Repositorio de Inventario
 * 
 * Basada en el patrón Repository para desacoplar el catálogo de productos
 * de la implementación de persistencia.
 */
export interface IInventoryRepository {
  /**
   * Listar ítems con paginación y filtros
   */
  findAll(
    tenantId: string,
    query: ProductQueryDTO
  ): Promise<{
    data: InventoryItem[];
    meta: {
      page: number;
      limit: number;
      total: number | null;
      total_pages: number;
    };
  }>;

  /**
   * Buscar un ítem por ID
   */
  findById(id: string, tenantId: string): Promise<InventoryItem | null>;

  /**
   * Buscar un ítem por SKU en el contexto del tenant
   */
  findBySku(sku: string, tenantId: string): Promise<InventoryItem | null>;

  /**
   * Crear un nuevo ítem (Producto)
   */
  create(data: CreateProductDTO, tenantId: string): Promise<InventoryItem>;

  /**
   * Actualizar un ítem existente
   */
  update(id: string, data: UpdateProductDTO, tenantId: string): Promise<InventoryItem>;

  /**
   * Eliminar un ítem (Soft Delete via Trigger)
   */
  delete(id: string, tenantId: string): Promise<void>;
}

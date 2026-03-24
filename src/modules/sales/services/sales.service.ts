import { createClient } from "@/lib/supabase/client"
import { CreateSaleDTO, Sale, SaleQuery } from "../types"

/**
 * SalesService (Frontend)
 * Interactúa con la API de ventas y permite suscripciones en tiempo real.
 */
export class SalesService {
  private supabase = createClient()

  /**
   * Listar ventas desde la API
   */
  async list(tenantId: string, query: SaleQuery = {}): Promise<{ data: Sale[], total: number }> {
    const params = new URLSearchParams()
    if (query.page) params.set('page', query.page.toString())
    if (query.limit) params.set('limit', query.limit.toString())
    if (query.state) params.set('state', query.state)
    if (query.customer_id) params.set('customer_id', query.customer_id)
    if (query.sort_by) params.set('sort_by', query.sort_by)
    if (query.sort_order) params.set('sort_order', query.sort_order)

    const response = await fetch(`/api/v1/sales?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Error al cargar el historial de ventas')
    }

    const { data, meta } = await response.json()
    return { data, total: meta.total }
  }

  /**
   * Obtener detalle de una venta
   */
  async getById(id: string): Promise<Sale> {
    const response = await fetch(`/api/v1/sales/${id}`)
    if (!response.ok) {
      throw new Error('Venta no encontrada')
    }
    const { data } = await response.json()
    return data
  }

  /**
   * Crear una nueva venta (via API)
   */
  async create(data: CreateSaleDTO): Promise<Sale> {
    const response = await fetch('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error?.message || 'Error al procesar la venta')
    }

    return result.data
  }

  /**
   * Actualizar estado de una venta (KDS / Workshop)
   * Nota: El backend disparará el RPC si el estado es completado.
   */
  async updateState(id: string, newState: string): Promise<void> {
    const response = await fetch(`/api/v1/sales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState })
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error?.message || 'Error al actualizar estado')
    }
  }

  /**
   * Suscribirse a cambios en tiempo real para el KDS
   */
  subscribeToKDS(tenantId: string, callback: (payload: Record<string, unknown>) => void) {
    return this.supabase
      .channel(`kds-tenant-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `tenant_id=eq.${tenantId}`,
        },
        callback
      )
      .subscribe()
  }
}

export const salesService = new SalesService()

import { createClient } from '@/lib/supabase/client'

import type { WorkOrder, WorkOrderState, ServiceItem } from '../types'

const SO_COLS = [
  'id','tenant_id','customer_id','vehicle_id','assigned_to','assigned_at',
  'created_by','name','description','diagnosis','notes','labor_cost',
  'parts_cost','total_cost','priority','state','received_at','started_at',
  'blocked_at','blocked_reason','completed_at','delivered_at',
  'location_id','created_at','updated_at','deleted_at'
].join(',')

const SI_COLS = [
  'id','service_id','product_id','description',
  'item_type','quantity','unit_price','subtotal','created_at'
].join(',')

export type CreateWorkOrderDTO = Omit<WorkOrder,
  'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'total_cost'
>

export type CreateServiceItemDTO = Omit<ServiceItem,
  'id' | 'subtotal' | 'created_at'
>

/**
 * Work Orders Service
 *
 * Las tablas `service_orders` y `service_items` no están en
 * database.types.ts. Se usa un tipo local `UntypedClient` que
 * permite acceder a cualquier tabla sin `as any`, manteniendo
 * tipado estricto en los resultados con `as unknown as T`.
 *
 * TODO(kpdadwtxfazhtoqnttdh): Regenerar tipos con Supabase CLI
 * para eliminar `UntypedClient`.
 */

interface QueryResult {
  data: unknown
  error: Error | null
}
interface QueryResultArray {
  data: unknown[] | null
  error: Error | null
}

/** Select chain: .select().eq()... returns Promise */
interface SelectChain {
  eq(col: string, val: string | number | boolean | null): Promise<QueryResultArray> & {
    eq(col: string, val: string | number | boolean | null): Promise<QueryResult> & {
      single(): Promise<QueryResult>
      order(col: string, opts: { ascending: boolean }): Promise<QueryResultArray>
    }
    single(): Promise<QueryResult>
    order(col: string, opts: { ascending: boolean }): Promise<QueryResultArray>
    is(col: string, val: null): {
      order(col: string, opts: { ascending: boolean }): Promise<QueryResultArray>
    }
  }
}

/** Cliente genérico para tablas aún no tipadas en database.types */
type UntypedClient = {
  from(table: string): {
    select(cols: string): SelectChain
    insert(data: Record<string, unknown>): {
      select(cols: string): { single(): Promise<QueryResult> }
    }
    update(data: Record<string, unknown>): {
      eq(col: string, val: string | number | boolean | null): {
        eq(col: string, val: string | number | boolean | null): Promise<QueryResult> & {
          select(cols: string): { single(): Promise<QueryResult> }
        }
        select(cols: string): { single(): Promise<QueryResult> }
      }
    }
    delete(): {
      eq(col: string, val: string): Promise<{ error: Error | null }>
    }
  }
}

function getWoClient(): UntypedClient {
  return createClient() as unknown as UntypedClient
}

export const workOrdersService = {
  async list(tenantId: string) {
    const db = getWoClient()
    const { data, error } = await db
      .from('service_orders')
      .select(SO_COLS)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as WorkOrder[]
  },

  async getById(id: string, tenantId: string) {
    const db = getWoClient()
    const { data, error } = await db
      .from('service_orders')
      .select(SO_COLS)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data as unknown as WorkOrder
  },

  async create(tenantId: string, dto: CreateWorkOrderDTO) {
    const db = getWoClient()
    const { data, error } = await db
      .from('service_orders')
      .insert({ ...dto, tenant_id: tenantId })
      .select(SO_COLS)
      .single()

    if (error) throw error
    return data as unknown as WorkOrder
  },

  async updateState(id: string, tenantId: string, state: WorkOrderState) {
    const db = getWoClient()
    const { data, error } = await db
      .from('service_orders')
      .update({ state })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(SO_COLS)
      .single()

    if (error) throw error
    return data as unknown as WorkOrder
  },

  async softDelete(id: string, tenantId: string) {
    const db = getWoClient()
    const { error } = await db
      .from('service_orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  },

  async addItem(item: CreateServiceItemDTO) {
    const db = getWoClient()
    const { data, error } = await db
      .from('service_items')
      .insert(item)
      .select(SI_COLS)
      .single()

    if (error) throw error
    return data as unknown as ServiceItem
  },

  async removeItem(itemId: string) {
    const db = getWoClient()
    const { error } = await db
      .from('service_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  },

  async getItems(serviceId: string) {
    const db = getWoClient()
    const { data, error } = await db
      .from('service_items')
      .select(SI_COLS)
      .eq('service_id', serviceId)

    if (error) throw error
    return (data ?? []) as unknown as ServiceItem[]
  },
}

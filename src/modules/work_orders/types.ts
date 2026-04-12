export type WorkOrderState =
  | 'RECIBIDO' | 'EN_DIAGNOSTICO' | 'EN_REPARACION'
  | 'ESPERANDO_REPUESTOS' | 'LISTO' | 'ENTREGADO' | 'CANCELADO'

export type WorkOrderPriority = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'

export type ServiceItemType = 'PART' | 'LABOR'

export interface ServiceItem {
  id: string
  service_id: string
  product_id: string | null
  description: string
  item_type: ServiceItemType
  quantity: number       // INTEGER
  unit_price: number    // INTEGER COP
  subtotal: number      // INTEGER COP — generado por DB
  created_at: string
}

export interface ServicePhoto {
  id: string
  service_id: string
  tenant_id: string
  url: string           // URL de Supabase Storage — nunca base64
  caption: string | null
  taken_at: string
  uploaded_by: string | null
}

export interface WorkOrder {
  id: string
  tenant_id: string
  customer_id: string | null
  vehicle_id: string | null     // nullable — módulo universal
  assigned_to: string | null
  assigned_at: string | null
  created_by: string | null
  name: string
  description: string
  diagnosis: string | null
  notes: string | null
  labor_cost: number            // INTEGER COP
  parts_cost: number            // INTEGER COP
  total_cost: number            // INTEGER COP — generado por DB
  priority: WorkOrderPriority
  state: WorkOrderState
  received_at: string
  started_at: string | null
  blocked_at: string | null
  blocked_reason: string | null
  completed_at: string | null
  delivered_at: string | null
  location_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

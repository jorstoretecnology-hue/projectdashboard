"use client"

import { useEffect, useState, useMemo } from "react"
import { Sale } from "@/modules/sales/types"
import { salesService } from "@/modules/sales/services/sales.service"
import { OrderCard } from "./OrderCard"
import { Loader2, Kanban, Utensils, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { logger } from "@/lib/logger"

interface KDSBoardProps {
  tenantId: string
}

export function KDSBoard({ tenantId }: KDSBoardProps) {
  const [orders, setOrders] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar órdenes iniciales
  const loadOrders = async () => {
    try {
      // Cargamos pendientes, en proceso y entregados recientemente (hoy)
      const { data } = await salesService.list(tenantId, { limit: 50, sort_by: 'created_at', sort_order: 'asc' })
      // Filtramos en el cliente para el KDS (solo lo operativo)
      setOrders(data.filter(o => ['PENDIENTE', 'EN_PROCESO', 'ENTREGADO', 'PAGADO'].includes(o.state)))
    } catch (error) {
      toast.error("Error al sincronizar pedidos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    // Suscripción Realtime
    const channel = salesService.subscribeToKDS(tenantId, (payload) => {
      logger.log('[KDSBoard] Realtime change:', payload)
      loadOrders() // Refrescamos todo para mantener consistencia de joins
      
      if (payload.event === 'INSERT') {
        // new Audio('/sounds/notification.mp3').play().catch(() => {}) // Sonido si es posible
        toast.info("¡Nuevo pedido recibido!")
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [tenantId])

  const handleStatusChange = async (id: string, nextStatus: string) => {
    try {
      await salesService.updateState(id, nextStatus)
      toast.success(`Pedido #${id.slice(0,5)} actualizado`)
      // El estado se actualizará automáticamente por la suscripción Realtime
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message)
    }
  }

  // Columnas
  const columns = useMemo(() => [
    { key: 'PENDIENTE', label: 'Pendientes', icon: <Utensils className="w-5 h-5 text-amber-500" />, color: 'bg-amber-500' },
    { key: 'EN_PROCESO', label: 'En Preparación', icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />, color: 'bg-blue-500' },
    { key: 'ENTREGADO', label: 'Entregados', icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, color: 'bg-green-500' },
  ], [])

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground">Sincronizando cocina...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[70vh]">
      {columns.map((column) => {
        // Consideramos PAGADO como PENDIENTE para el flujo de restaurante si aplica
        const columnOrders = orders.filter(o => 
          o.state === column.key || (column.key === 'PENDIENTE' && o.state === 'PAGADO')
        )
        
        return (
          <div key={column.key} className="flex flex-col gap-4 bg-muted/20 rounded-xl border p-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="font-bold text-sm uppercase tracking-wider">{column.label}</h3>
              </div>
              <Badge variant="secondary" className="font-mono">{columnOrders.length}</Badge>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 custom-scrollbar">
              {columnOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                  <Kanban className="w-12 h-12 mb-2" />
                  <p className="text-xs font-medium">Vacío</p>
                </div>
              ) : (
                columnOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MessageSquare, CheckCircle, ChevronRight } from "lucide-react"
import { Sale } from "@/modules/sales/types"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface OrderCardProps {
  order: Sale
  onStatusChange?: (id: string, nextStatus: string) => void
  disabled?: boolean
}

export function OrderCard({ order, onStatusChange, disabled }: OrderCardProps) {
  const [timeSince, setTimeSince] = useState<string>("")

  // Actualizar timer cada minuto
  useEffect(() => {
    const updateTime = () => {
      setTimeSince(formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [order.created_at])

  // Determinar siguiente estado lógico y color
  const statusConfig: Record<string, { label: string; color: string; next?: string }> = {
    PENDIENTE: { label: "Pendiente", color: "bg-amber-100 text-amber-800 border-amber-200", next: "EN_PROCESO" },
    EN_PROCESO: { label: "En Proceso", color: "bg-blue-100 text-blue-800 border-blue-200", next: "ENTREGADO" },
    ENTREGADO: { label: "Listo / Entregado", color: "bg-green-100 text-green-800 border-green-200" },
  }

  const currentStatus = statusConfig[order.state] || { label: order.state, color: "bg-gray-100" }

  return (
    <Card className={cn(
      "border-2 transition-all duration-200",
      order.state === 'PENDIENTE' ? "border-amber-200 bg-amber-50/10" : "border-muted"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {order.metadata?.mesa ? `Mesa #${order.metadata.mesa}` : `Orden #${order.id.slice(0, 5)}`}
              {order.metadata?.zona && (
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {order.metadata.zona}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{timeSince}</span>
            </div>
          </div>
          <Badge className={cn("text-[10px] uppercase font-bold", currentStatus.color)}>
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 pb-3 space-y-3">
        <div className="space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="group">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-medium leading-tight">
                  <span className="text-primary font-bold mr-2">{item.quantity}x</span>
                  {item.product_name}
                </span>
              </div>
              {item.notes && (
                <div className="flex items-center gap-1.5 mt-1 ml-6 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded border border-orange-100 italic">
                  <MessageSquare className="w-3 h-3" />
                  "{item.notes}"
                </div>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="pt-2 border-t text-xs text-muted-foreground italic">
            <strong>Nota general:</strong> {order.notes}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0">
        {currentStatus.next && (
          <Button 
            className="w-full font-bold h-10 shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onStatusChange?.(order.id, currentStatus.next!)}
            disabled={disabled}
            variant={order.state === 'PENDIENTE' ? 'default' : 'secondary'}
          >
            {order.state === 'PENDIENTE' ? (
              <span className="flex items-center gap-2">
                Empezar Preparación <ChevronRight className="w-4 h-4" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Marcar como Listo <CheckCircle className="w-4 h-4" />
              </span>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

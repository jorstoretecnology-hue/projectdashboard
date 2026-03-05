"use client"

import { Check, Clock, Wrench, Wallet, Gift, Truck } from "lucide-react"
import { SaleState } from "@/modules/sales/types"

interface Step {
  id: SaleState
  label: string
  icon: any
  description: string
}

const STEPS: Step[] = [
  { id: 'PENDIENTE', label: 'Recibido', icon: Clock, description: 'Equipo recibido en el taller' },
  { id: 'EN_PROCESO', label: 'En Servicio', icon: Wrench, description: 'Nuestros técnicos están trabajando' },
  { id: 'PAGADO', label: 'Reparado', icon: Wallet, description: 'Listo para retiro o entrega' },
  { id: 'ENTREGADO', label: 'Finalizado', icon: Truck, description: 'Equipo entregado satisfactoriamente' },
]

interface TimelineProps {
  currentState: SaleState
  updatedAt?: string
}

export function Timeline({ currentState, updatedAt }: TimelineProps) {
  const currentIdx = STEPS.findIndex(s => s.id === currentState)
  const safeIdx = currentIdx === -1 ? 0 : currentIdx

  // Formatear fecha de forma segura
  const formattedDate = updatedAt 
    ? new Date(updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="relative">
      {/* Línea de conexión de fondo */}
      <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-muted md:left-0 md:top-[22px] md:bottom-auto md:w-full md:h-0.5" />

      <div className="relative flex flex-col space-y-8 md:flex-row md:space-y-0 md:justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < safeIdx
          const isCurrent = idx === safeIdx
          const Icon = step.icon

          return (
            <div key={step.id} className="flex items-start md:flex-col md:items-center md:flex-1 group">
              {/* Círculo/Icono */}
              <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-500 bg-background ${
                isCompleted ? "border-primary bg-primary text-primary-foreground" : 
                isCurrent ? "border-primary text-primary animate-pulse" : 
                "border-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>

              {/* Texto */}
              <div className="ml-4 md:ml-0 md:mt-4 md:text-center">
                <h4 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                  isCurrent || isCompleted ? "text-primary" : "text-muted-foreground"
                }`}>
                  {step.label}
                </h4>
                <p className="text-xs text-muted-foreground max-w-[150px] mt-1 line-clamp-2">
                  {isCurrent && formattedDate ? `Actualizado: ${formattedDate}` : step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

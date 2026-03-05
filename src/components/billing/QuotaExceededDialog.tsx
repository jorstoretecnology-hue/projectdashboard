"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Zap } from "lucide-react"

interface QuotaExceededDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: string
}

const RESOURCE_LABELS: Record<string, string> = {
  maxInventoryItems: "items de inventario",
  maxCustomers: "clientes",
  maxUsers: "usuarios",
}

export function QuotaExceededDialog({
  open,
  onOpenChange,
  resource,
}: QuotaExceededDialogProps) {
  const resourceLabel = RESOURCE_LABELS[resource] || "recursos"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center">Límite del plan alcanzado</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Has alcanzado el máximo de <strong>{resourceLabel}</strong> permitidos por tu plan actual. Para seguir creando, necesitas mejorar tu suscripción.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0">
            <Zap className="mr-2 h-4 w-4" />
            Actualizar Plan
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

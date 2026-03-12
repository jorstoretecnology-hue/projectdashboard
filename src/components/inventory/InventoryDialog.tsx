"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InventoryForm } from "./InventoryForm"
import { INVENTORY_ACTIONS, createInventoryItemAction, updateInventoryItemAction } from "@/modules/inventory/actions"
import { InventoryFormValues, InventoryItem } from "@/modules/inventory/types"
import { useTenant } from "@/providers"
import { toast } from "sonner"
import { useQuotaError } from "@/hooks/use-quota-error"
import { QuotaExceededDialog } from "@/components/billing/QuotaExceededDialog"

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItem | null // Si hay item, es modo edición
  onSuccess?: () => void
}

export function InventoryDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: InventoryDialogProps) {
  const { currentTenant } = useTenant()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { quotaResource, handleQuotaError, resetQuotaError } = useQuotaError()

  const isEditing = !!item
  const actionConfig = isEditing ? INVENTORY_ACTIONS.update : INVENTORY_ACTIONS.create

  // Valores iniciales para el formulario
  const defaultValues: Partial<InventoryFormValues> = item ? {
    name: item.name,
    description: item.description,
    type: item.type,
    price: item.price,
    stock: item.stock,
    sku: item.sku,
  } : {}

  const handleSubmit = async (data: InventoryFormValues) => {
    if (!currentTenant?.id) {
      toast.error("Error de sesión: No se identificó el tenant.")
      return
    }

    setIsSubmitting(true)
    resetQuotaError()

    try {
      if (isEditing && item) {
        await updateInventoryItemAction(item.id, data)
        toast.success("Producto actualizado correctamente")
      } else {
        await createInventoryItemAction(data)
        toast.success("Producto creado exitosamente")
      }
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error: unknown) {
      const isQuota = handleQuotaError(error as Error)
      if (isQuota) return 

      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{actionConfig.label}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifica los detalles del producto o servicio." 
                : "Agrega un nuevo producto o servicio al inventario."}
            </DialogDescription>
          </DialogHeader>
          
          <InventoryForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
            defaultValues={defaultValues}
          />
        </DialogContent>
      </Dialog>
      
      <QuotaExceededDialog 
        open={!!quotaResource} 
        onOpenChange={(v) => !v && resetQuotaError()} 
        resource={quotaResource || ""} 
      />
    </>
  )
}

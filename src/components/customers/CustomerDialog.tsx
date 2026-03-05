"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomerForm } from "./CustomerForm"
import { type CustomerFormValues, type Customer } from "@/modules/customers/types"
import { createCustomerAction, updateCustomerAction } from "@/modules/customers/actions"
import { useTenant } from "@/providers"
import { toast } from "sonner"
import { useQuotaError } from "@/hooks/use-quota-error"
import { QuotaExceededDialog } from "@/components/billing/QuotaExceededDialog"

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: Customer) => void
  customer?: Customer | null // Si hay cliente, es modo edición
}

export function CustomerDialog({
  open,
  onOpenChange,
  onSuccess,
  customer,
}: CustomerDialogProps) {
  const { currentTenant } = useTenant()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { quotaResource, handleQuotaError, resetQuotaError } = useQuotaError()
  
  const isEdit = !!customer

  const handleSubmit = async (data: CustomerFormValues) => {
    if (!currentTenant?.id) {
       toast.error("Error de sesión: Tenant no identificado.")
       return
    }

    setIsSubmitting(true)
    resetQuotaError()

    try {
      let result: Customer
      if (isEdit && customer) {
        result = await updateCustomerAction(customer.id, data, currentTenant.id)
        toast.success("Cliente actualizado correctamente")
      } else {
        result = await createCustomerAction(data, currentTenant.id)
        toast.success("Cliente creado correctamente")
      }
      
      onSuccess?.(result)
      onOpenChange(false)
    } catch (error: any) {
      // Manejar error de permiso o quota
      if (error.message?.includes("ACCESO_DENEGADO")) {
        toast.error("No tienes permisos suficientes.")
        return
      }
      if (handleQuotaError(error)) return
      
      console.error(error)
      toast.error(isEdit ? "Error al actualizar el cliente" : "Error al crear el cliente")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {isEdit 
                ? "Modifica los datos del cliente seleccionado." 
                : "Registra un nuevo cliente en tu base de datos."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <CustomerForm
              key={customer?.id || 'new'}
              defaultValues={customer || undefined}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isSubmitting={isSubmitting}
            />
          </div>
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

"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Search, Loader2 } from "lucide-react"
import { useTenant } from "@/providers"
import { cn } from "@/lib/utils"

import { CustomerHeader } from "@/components/customers/CustomerHeader"
import { CustomerToolbar } from "@/components/customers/CustomerToolbar"
import { CustomerTable } from "@/components/customers/CustomerTable"
import { CustomerDialog } from "@/components/customers/CustomerDialog"
import { deleteCustomerAction } from "@/modules/customers/actions"
import { customersService } from "@/modules/customers/services/customers.service"
import { Customer } from "@/modules/customers/types"
import { format } from "date-fns"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CustomersPage() {
  const { currentTenant } = useTenant()

  // 1. Seguridad SaaS
  const isModuleActive = useMemo(() => {
    return currentTenant?.activeModules?.includes("Customers")
  }, [currentTenant])

  // 2. Estado UI
  const [items, setItems] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("list") // Default list
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Cliente seleccionado para editar o borrar
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 3. Carga de Datos
  const loadCustomers = async () => {
    if (!currentTenant?.id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await customersService.list(currentTenant.id)
      setItems(data)
    } catch (err: any) {
      console.error(err)
      setError("Error cargando clientes. Intenta recargar.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isModuleActive) loadCustomers()
  }, [currentTenant?.id, isModuleActive])

  // 4. Filtrado Local
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    )
  }, [items, search])

  // 5. Handlers CRUD
  const handleOpenCreate = () => {
    setSelectedCustomer(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    loadCustomers() // Refetch automático
  }

  const handleConfirmDelete = async () => {
    if (!selectedCustomer || !currentTenant?.id) return

    setIsDeleting(true)
    try {
      await deleteCustomerAction(selectedCustomer.id, currentTenant.id)
      toast.success("Cliente eliminado correctamente")
      loadCustomers()
      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      if (error.message?.includes("ACCESO_DENEGADO")) {
        toast.error("No tienes permiso para borrar clientes.")
      } else {
        console.error(error)
        toast.error("Error al eliminar el cliente")
      }
    } finally {
      setIsDeleting(false)
      setSelectedCustomer(null)
    }
  }

  // 6. Guard Clause
  if (!isModuleActive) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Users className="h-5 w-5" />
              Módulo no disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            El módulo de Clientes no está activo en tu plan. Contacta a un administrador.
          </CardContent>
        </Card>
      </div>
    )
  }

  // 7. Render
  return (
    <div className="space-y-6 p-6">
      <CustomerHeader
        currentView={view}
        onViewChange={setView}
        onCreate={handleOpenCreate}
      />

      <CustomerToolbar search={search} onSearchChange={setSearch} />

       {/* Loading / Error */}
       {isLoading && (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Cargando clientes...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="py-10 text-center text-destructive border border-destructive/20 bg-destructive/5 rounded-xl">
          <p>{error}</p>
          <button onClick={loadCustomers} className="mt-2 underline text-sm">Reintentar</button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="py-20 text-center text-muted-foreground/50 border-2 border-dashed rounded-xl bg-muted/30">
          <Users className="mx-auto h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No hay clientes</p>
          <p className="text-sm">Empieza registrando tu primer cliente.</p>
          <button 
            onClick={handleOpenCreate}
            className="mt-4 text-primary font-bold hover:underline"
          >
            Añadir Cliente +
          </button>
        </div>
      )}

      {/* Lista / Tabla */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <CustomerTable 
             customers={filteredItems} 
             onEdit={handleOpenEdit} 
             onDelete={handleOpenDelete} 
           />
        </div>
      )}

      {/* Dialogos */}
      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={selectedCustomer}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al cliente <strong>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</strong> permanentemente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

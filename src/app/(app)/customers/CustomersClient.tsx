"use client"

import { Users, Loader2, UserCheck, UserPlus, Users2, UserX } from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { useMemo, useState, useDeferredValue, useCallback } from "react"
import { toast } from "sonner"

import { CustomerDialog } from "@/components/customers/CustomerDialog"
import { CustomerHeader } from "@/components/customers/CustomerHeader"
import { CustomerTable } from "@/components/customers/CustomerTable"
import { CustomerToolbar } from "@/components/customers/CustomerToolbar"
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
import { Card, CardContent } from "@/components/ui/card"
import { deleteCustomerAction } from "@/modules/customers/actions"
import { customersService } from "@/modules/customers/services/customers.service"
import type { Customer } from "@/modules/customers/types"

interface CustomersClientProps {
  initialCustomers: Customer[]
  tenantId: string
}

export function CustomersClient({ initialCustomers, tenantId }: CustomersClientProps) {
  // 1. Estado UI - Sincronizado con URL vía nuqs
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: false, clearOnDefault: true }));
  const deferredSearch = useDeferredValue(search)
  
  const [items, setItems] = useState<Customer[]>(initialCustomers)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [view, setView] = useState<"grid" | "list">("list")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 2. Carga de Datos (para Refetch)
  const loadCustomers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await customersService.list(tenantId)
      setItems(data)
    } catch {
      setError("Error cargando clientes. Intenta recargar.")
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  // 3. Filtrado Local con deferred value
  const filteredItems = useMemo(() => {
    const q = deferredSearch.toLowerCase()
    return items.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    )
  }, [items, deferredSearch])


  // Métricas para KPIs
  const metrics = useMemo(() => {
    const total = items.length
    const active = items.filter(c => c.status === 'active').length
    const leads = items.filter(c => c.status === 'lead').length
    const inactive = items.filter(c => c.status === 'inactive').length
    
    return { total, active, leads, inactive }
  }, [items])

  // 4. Handlers CRUD memoizados
  const handleOpenCreate = useCallback(() => {
    setSelectedCustomer(null)
    setIsDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDialogOpen(true)
  }, [])

  const handleOpenDelete = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDialogSuccess = useCallback(() => {
    loadCustomers()
  }, [loadCustomers])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedCustomer) return

    setIsDeleting(true)
    try {
      await deleteCustomerAction(selectedCustomer.id)
      toast.success("Cliente eliminado correctamente")
      loadCustomers()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes("ACCESO_DENEGADO")) {
        toast.error("No tienes permiso para borrar clientes.")
      } else {
        toast.error("Error al eliminar el cliente")
      }
    } finally {
      setIsDeleting(false)
      setSelectedCustomer(null)
    }
  }, [selectedCustomer, loadCustomers])

  return (
    <div className="space-y-6">
      <CustomerHeader
        currentView={view}
        onViewChange={setView}
        onCreate={handleOpenCreate}
      />

      <CustomerToolbar search={search} onSearchChange={setSearch} />

      {/* KPIs */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Users2 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Clientes</p>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {metrics.total}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Activos</p>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {metrics.active}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <UserPlus size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Leads Nuevos</p>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {metrics.leads}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-slate-500/10 rounded-xl text-slate-500">
                <UserX size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Inactivos</p>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {metrics.inactive}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

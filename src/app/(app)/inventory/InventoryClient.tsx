"use client"

import { useMemo, useState } from "react"
import { Package, Loader2, DollarSign, AlertCircle, PackageCheck } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { InventoryHeader } from "@/components/inventory/InventoryHeader"
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar"
import { InventoryCard } from "@/components/inventory/InventoryCard"
import { InventoryDialog } from "@/components/inventory/InventoryDialog"
import { inventoryService } from "@/modules/inventory/services/inventory.service"
import { deleteInventoryItemAction } from "@/modules/inventory/actions"
import type { InventoryItem } from "@/modules/inventory/types"
import { cn } from "@/lib/utils"
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

interface InventoryClientProps {
  initialItems: InventoryItem[]
  tenantId: string
}

export function InventoryClient({ initialItems, tenantId }: InventoryClientProps) {
  // 1. Estado UI
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 2. Carga de Datos (Refetch)
  const loadInventory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await inventoryService.list(tenantId)
      setItems(data)
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar el inventario. Intenta refrescar.")
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Filtrado Local
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q)
    )
  }, [items, search])

  // Métricas para KPIs
  const metrics = useMemo(() => {
    const totalItems = items.length
    const lowStock = items.filter(i => (i.stock ?? 0) <= 5 && (i.stock ?? 0) > 0).length
    const outOfStock = items.filter(i => (i.stock ?? 0) <= 0).length
    const totalValue = items.reduce((acc, i) => acc + (i.price * (i.stock ?? 0)), 0)
    
    return { totalItems, lowStock, outOfStock, totalValue }
  }, [items])

  // 4. Handlers
  const handleOpenCreate = () => {
    setSelectedItem(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedItem) return

    setIsDeleting(true)
    try {
      await deleteInventoryItemAction(selectedItem.id)
      toast.success("Producto eliminado correctamente")
      loadInventory()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes("ACCESO_DENEGADO")) {
        toast.error("No tienes permiso para eliminar items.")
      } else {
        console.error(error)
        toast.error("Error al eliminar el producto")
      }
    } finally {
      setIsDeleting(false)
      setSelectedItem(null)
    }
  }

  return (
    <div className="space-y-6">
      <InventoryHeader
        currentView={view}
        onViewChange={setView}
        onCreate={handleOpenCreate}
      />

      {/* KPIs */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <PackageCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Ítems</p>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.totalItems}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Stock Crítico</p>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.lowStock}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Sin Stock</p>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.outOfStock}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Valor Est.</p>
                <div className="text-2xl font-bold text-foreground">
                  ${metrics.totalValue.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <InventoryToolbar search={search} onSearchChange={setSearch} />

      {/* Estados de Carga y Error */}
      {isLoading && (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Cargando inventario...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="py-10 text-center text-destructive border border-destructive/20 bg-destructive/5 rounded-xl">
          <p>{error}</p>
          <button 
            onClick={loadInventory} 
            className="underline text-sm mt-2 font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="py-20 text-center text-muted-foreground/50 border-2 border-dashed rounded-xl bg-muted/30">
          <Package className="mx-auto h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No se encontraron items</p>
          <p className="text-sm">Empieza agregando tu primer producto.</p>
          <button 
            onClick={handleOpenCreate}
            className="mt-4 text-primary font-bold hover:underline"
          >
            Añadir Producto +
          </button>
        </div>
      )}

      {/* Lista de Items */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div
          className={cn(
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-2"
          )}
        >
          {filteredItems.map((item) => (
            <InventoryCard 
              key={item.id} 
              item={item} 
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Diálogos */}
      <InventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={selectedItem}
        onSuccess={loadInventory}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará <strong>{selectedItem?.name}</strong> permanentemente del inventario. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
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

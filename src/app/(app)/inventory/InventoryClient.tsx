"use client"

import { useMemo, useState, useDeferredValue, useCallback } from "react"
import { Package, Loader2, DollarSign, AlertCircle, PackageCheck, Plus } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { InventoryHeader } from "@/components/inventory/InventoryHeader"
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar"
import { InventoryCard } from "@/components/inventory/InventoryCard"
import { InventoryDialog } from "@/components/inventory/InventoryDialog"
import { EmptyState } from "@/components/ui/empty-state"
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
  const deferredSearch = useDeferredValue(search)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 2. Carga de Datos (Refetch)
  const loadInventory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await inventoryService.list(tenantId)
      setItems(data)
    } catch {
      setError("No se pudo cargar el inventario. Intenta refrescar.")
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  // 3. Filtrado Local con deferred value
  const filteredItems = useMemo(() => {
    const q = deferredSearch.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q)
    )
  }, [items, deferredSearch])

  // Métricas para KPIs - combinando iteraciones (Fase 4)
  const metrics = useMemo(() => {
    let totalItems = 0
    let lowStock = 0
    let outOfStock = 0
    let totalValue = 0
    
    for (const item of items) {
      totalItems++
      const stock = item.stock ?? 0
      if (stock <= 5 && stock > 0) lowStock++
      if (stock <= 0) outOfStock++
      totalValue += item.price * stock
    }
    
    return { totalItems, lowStock, outOfStock, totalValue }
  }, [items])

  // 4. Handlers memoizados
  const handleOpenCreate = useCallback(() => {
    setSelectedItem(null)
    setIsDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((item: InventoryItem) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }, [])

  const handleOpenDelete = useCallback((item: InventoryItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
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
        toast.error("Error al eliminar el producto")
      }
    } finally {
      setIsDeleting(false)
      setSelectedItem(null)
    }
  }, [selectedItem, loadInventory])

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
        <EmptyState
          icon={Package}
          title="No se encontraron items"
          description={search ? "No hay productos que coincidan con tu búsqueda." : "Empieza agregando tu primer producto al inventario."}
          action={{
            label: search ? "Limpiar búsqueda" : "Añadir Producto",
            onClick: search ? () => setSearch("") : handleOpenCreate
          }}
        />
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

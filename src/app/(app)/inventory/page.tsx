"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Loader2 } from "lucide-react"
import { useTenant } from "@/providers"
import { cn } from "@/lib/utils"
import { InventoryHeader } from "@/components/inventory/InventoryHeader"
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar"
import { InventoryCard } from "@/components/inventory/InventoryCard"
import { InventoryDialog } from "@/components/inventory/InventoryDialog"
import { inventoryService } from "@/modules/inventory/services/inventory.service"
import { deleteInventoryItemAction } from "@/modules/inventory/actions"
import type { InventoryItem } from "@/modules/inventory/types"
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

export default function InventoryPage() {
  const { currentTenant } = useTenant()

  // 1. Seguridad SaaS
  const isModuleActive = useMemo(() => {
    return currentTenant?.activeModules?.includes("Inventory")
  }, [currentTenant])

  // 2. Estado UI
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 3. Carga de Datos
  const loadInventory = async () => {
    if (!currentTenant?.id || !isModuleActive) return

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await inventoryService.list(currentTenant.id)
      setItems(data)
    } catch (err: any) {
      console.error(err)
      setError("No se pudo cargar el inventario. Intenta refrescar.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [currentTenant?.id, isModuleActive])

  // 4. Filtrado Local
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q)
    )
  }, [items, search])

  // 5. Handlers
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
    if (!selectedItem || !currentTenant?.id) return

    setIsDeleting(true)
    try {
      await deleteInventoryItemAction(selectedItem.id)
      toast.success("Producto eliminado correctamente")
      loadInventory()
      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      if (error.message?.includes("ACCESO_DENEGADO")) {
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

  // 6. Guard Clause
  if (!isModuleActive) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Módulo no disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Tu plan actual no incluye el módulo de Inventario.
          </CardContent>
        </Card>
      </div>
    )
  }

  // 7. Render
  return (
    <div className="space-y-6 p-6">
      <InventoryHeader
        currentView={view}
        onViewChange={setView}
        onCreate={handleOpenCreate}
      />

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

import { Button } from "@/components/ui/button"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { LayoutGrid, List, Plus } from "lucide-react"

interface InventoryHeaderProps {
  onViewChange: (view: "grid" | "list") => void
  currentView: "grid" | "list"
  onCreate: () => void
}

export function InventoryHeader({
  onViewChange,
  currentView,
  onCreate,
}: InventoryHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de productos, servicios y stock
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={currentView === "grid" ? "secondary" : "outline"}
          size="icon"
          onClick={() => onViewChange("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={currentView === "list" ? "secondary" : "outline"}
          size="icon"
          onClick={() => onViewChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
        <PermissionGuard requiredPermission="inventory.create">
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </PermissionGuard>
      </div>
    </div>
  )
}

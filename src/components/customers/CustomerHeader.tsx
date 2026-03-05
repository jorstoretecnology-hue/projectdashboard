import { Button } from "@/components/ui/button"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { LayoutGrid, List, UserPlus } from "lucide-react"
import { CUSTOMERS_ACTIONS } from "@/modules/customers/types"

interface CustomerHeaderProps {
  onViewChange: (view: "grid" | "list") => void
  currentView: "grid" | "list"
  onCreate: () => void
}

export function CustomerHeader({
  onViewChange,
  currentView,
  onCreate,
}: CustomerHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de cartera de clientes y prospectos
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
        
        <PermissionGuard requiredPermission={CUSTOMERS_ACTIONS.create.permission}>
          <Button onClick={onCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            {CUSTOMERS_ACTIONS.create.label}
          </Button>
        </PermissionGuard>
      </div>
    </div>
  )
}

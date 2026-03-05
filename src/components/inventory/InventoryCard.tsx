import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InventoryItem } from "@/modules/inventory/types"
import { MoreVertical, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface InventoryCardProps {
  item: InventoryItem
  onEdit?: (item: InventoryItem) => void
  onDelete?: (item: InventoryItem) => void
}

export function InventoryCard({ item, onEdit, onDelete }: InventoryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium leading-none">
            {item.name}
          </CardTitle>
          {item.sku && (
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0">
            {item.type}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu de acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => onEdit?.(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Stock:{" "}
            <strong className={Number(item.stock) <= 5 ? "text-destructive" : "text-foreground"}>
              {typeof item.stock === "number" ? item.stock : "∞"}
            </strong>
          </span>
          <span className="text-lg font-bold">
            ${item.price.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

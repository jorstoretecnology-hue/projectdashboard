import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface InventoryToolbarProps {
  search: string
  onSearchChange: (value: string) => void
}

export function InventoryToolbar({
  search,
  onSearchChange,
}: InventoryToolbarProps) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por nombre o SKU"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}

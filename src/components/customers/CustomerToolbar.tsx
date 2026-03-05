import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface CustomerToolbarProps {
  search: string
  onSearchChange: (value: string) => void
}

export function CustomerToolbar({
  search,
  onSearchChange,
}: CustomerToolbarProps) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}

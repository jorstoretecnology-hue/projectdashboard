import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ArchitectureSection() {
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <Info className="h-5 w-5 text-primary" />
      <h2 className="font-semibold text-foreground">Arquitectura de Componentes</h2>
      <Badge variant="secondary" className="text-xs">
        shadcn/ui
      </Badge>
    </div>
  );
}

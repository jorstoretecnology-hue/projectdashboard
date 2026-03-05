import { Badge } from "@/components/ui/badge";

export function HeroBanner() {
  return (
    <div className="gradient-hero rounded-xl p-8 text-primary-foreground animate-fade-in">
      <Badge variant="secondary" className="mb-4 bg-primary-foreground/20 text-primary-foreground border-0 font-medium">
        2.0 Stable
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight mb-3">
        Dashboard Universal
      </h1>
      <p className="text-lg text-primary-foreground/80 max-w-xl leading-relaxed">
        Centro de mando unificado. Orquesta tus módulos, gestiona servicios y 
        personaliza tu entorno de trabajo con componentes de última generación.
      </p>
    </div>
  );
}

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLAN_INFO, PlanType } from '@/config/tenants';
import { Crown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrentPlanBannerProps {
  planInfo: typeof PLAN_INFO[PlanType];
}

export function CurrentPlanBanner({ planInfo }: CurrentPlanBannerProps) {
  const isPremium = planInfo.name === 'Enterprise' || planInfo.name === 'Professional';
  
  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
      isPremium ? "border-primary/50 bg-gradient-to-br from-primary/5 via-background to-background" : "border-border"
    )}>
      {/* Decorative gradient overlay */}
      {isPremium && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
      )}
      
      <CardHeader className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Tu Plan Actual
            </CardTitle>
            <div className="flex items-center gap-3">
              {isPremium && <Crown className="h-6 w-6 text-primary" />}
              <h2 className="text-3xl font-bold tracking-tight">{planInfo.name}</h2>
            </div>
          </div>
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
            Activo
          </Badge>
        </div>
        
        <CardDescription className="text-base">
          <span className="text-3xl font-bold text-foreground">{planInfo.price}</span>
          <span className="text-muted-foreground"> / mes</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">Características incluidas:</p>
          <ul className="space-y-2">
            {planInfo.features.slice(0, 4).map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground leading-tight">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Usuarios</p>
              <p className="font-semibold">{planInfo.maxUsers === 999 ? 'Ilimitados' : planInfo.maxUsers}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Módulos</p>
              <p className="font-semibold">{planInfo.maxModules}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
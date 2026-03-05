
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanType, PLAN_INFO } from '@/config/tenants';

interface PlanCardProps {
  planKey: PlanType;
  planInfo: typeof PLAN_INFO[PlanType];
  isCurrent: boolean;
  onUpgrade: (planKey: PlanType) => void;
}

export function PlanCard({ planKey, planInfo, isCurrent, onUpgrade }: PlanCardProps) {
  const isPremium = planKey === 'enterprise' || planKey === 'professional';
  const isPopular = planKey === 'professional';
  
  return (
    <Card className={cn(
      "relative flex flex-col transition-all duration-300 hover:shadow-2xl",
      isCurrent ? "border-2 border-primary shadow-lg ring-2 ring-primary/20" : "border-2 hover:border-primary/50",
      isPremium && "bg-gradient-to-br from-primary/5 via-background to-background"
    )}>
      {/* Popular badge */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary hover:bg-primary shadow-lg">
            <Zap className="h-3 w-3 mr-1" />
            Más Popular
          </Badge>
        </div>
      )}
      
      {/* Current plan indicator */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-lg">
            Plan Actual
          </Badge>
        </div>
      )}
      
      <CardHeader className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{planInfo.name}</CardTitle>
          {isPremium && <Crown className="h-6 w-6 text-primary" />}
        </div>
        
        <div className="w-full overflow-hidden">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className={cn(
              "font-bold tracking-tight break-words",
              planInfo.price.includes('$') ? "text-4xl" : "text-2xl"
            )}>{planInfo.price.split('/')[0]}</span>
            <span className="text-muted-foreground">/ mes</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {planInfo.maxUsers === 999 ? 'Usuarios ilimitados' : `Hasta ${planInfo.maxUsers} usuarios`} • {planInfo.maxModules} módulos
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-3">
          {planInfo.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-tight">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-6">
        <Button
          className={cn(
            "w-full h-11 font-semibold transition-all",
            isCurrent && "opacity-50 cursor-not-allowed"
          )}
          variant={isCurrent ? "outline" : isPremium ? "default" : "outline"}
          disabled={isCurrent}
          onClick={() => onUpgrade(planKey)}
        >
          {isCurrent ? '✓ Plan Actual' : 'Actualizar Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}

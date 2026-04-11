
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PLAN_INFO, type PlanType } from '@/config/tenants';
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanType;
  targetPlan: PlanType;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function UpgradePlanDialog({ 
  open, 
  onOpenChange, 
  currentPlan, 
  targetPlan, 
  onConfirm,
  isLoading = false
}: UpgradePlanDialogProps) {
  const currentPlanInfo = PLAN_INFO[currentPlan];
  const targetPlanInfo = PLAN_INFO[targetPlan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentPlan === targetPlan ? 'Detalles de tu Plan Actual' : 'Actualizar Plan'}</DialogTitle>
          <DialogDescription>
            {currentPlan === targetPlan 
              ? 'Estás revisando los beneficios incluidos en tu suscripción activa.' 
              : 'Revisa los detalles de tu nuevo plan.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div>
              <h3 className="font-semibold text-lg">{currentPlanInfo.name}</h3>
              <p className="text-sm text-muted-foreground">Plan Actual</p>
            </div>
            {currentPlan !== targetPlan && (
              <div>
                <h3 className="font-semibold text-lg text-primary">{targetPlanInfo.name}</h3>
                <p className="text-sm text-muted-foreground">Nuevo Plan</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">
              {currentPlan === targetPlan ? 'Lo que incluye tu plan:' : `Características destacadas del plan ${targetPlanInfo.name}:`}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {targetPlanInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-1 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {currentPlan === targetPlan ? 'Cerrar' : 'Cancelar'}
          </Button>
          {currentPlan !== targetPlan && (
            <Button onClick={onConfirm} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Ir a MercadoPago
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

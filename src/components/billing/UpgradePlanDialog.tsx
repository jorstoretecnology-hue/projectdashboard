
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
import { CheckCircle } from 'lucide-react';

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanType;
  targetPlan: PlanType;
  onConfirm: () => void;
}

export function UpgradePlanDialog({ open, onOpenChange, currentPlan, targetPlan, onConfirm }: UpgradePlanDialogProps) {
  const currentPlanInfo = PLAN_INFO[currentPlan];
  const targetPlanInfo = PLAN_INFO[targetPlan];

  const handleUpgrade = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar Plan</DialogTitle>
          <DialogDescription>
            Revisa los detalles de tu nuevo plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div>
              <h3 className="font-semibold text-lg">{currentPlanInfo.name}</h3>
              <p className="text-sm text-muted-foreground">Plan Actual</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary">{targetPlanInfo.name}</h3>
              <p className="text-sm text-muted-foreground">Nuevo Plan</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Características destacadas del plan {targetPlanInfo.name}:</h4>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleUpgrade}>
            Confirmar Upgrade (Simulado)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

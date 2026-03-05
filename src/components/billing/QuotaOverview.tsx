import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Quota {
  key: string;
  title: string;
  description: string;
  used: number;
  limit: number | 'unlimited';
}

interface QuotaOverviewProps {
  quotas: Quota[];
}

export function QuotaOverview({ quotas }: QuotaOverviewProps) {
  const getUsageStatus = (used: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 'safe';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return AlertCircle;
      case 'warning': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Uso de Recursos</CardTitle>
        <CardDescription>
          Monitorea el consumo de tus límites según tu plan actual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {quotas.map((quota) => {
          const status = getUsageStatus(quota.used, quota.limit);
          const StatusIcon = getStatusIcon(status);
          const percentage = quota.limit !== 'unlimited' ? (quota.used / quota.limit) * 100 : 0;
          
          return (
            <div key={quota.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-5 w-5", getStatusColor(status))} />
                  <div>
                    <p className="font-semibold">{quota.title}</p>
                    <p className="text-xs text-muted-foreground">{quota.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {quota.used} / {quota.limit === 'unlimited' ? '∞' : quota.limit}
                  </p>
                  {quota.limit !== 'unlimited' && (
                    <p className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% usado
                    </p>
                  )}
                </div>
              </div>
              
              {quota.limit !== 'unlimited' && (
                <Progress 
                  value={percentage} 
                  className="h-2"
                  indicatorClassName={getProgressColor(status)}
                />
              )}
              
              {status === 'critical' && (
                <p className="text-xs text-red-500 font-medium">
                  ⚠️ Límite casi alcanzado. Considera actualizar tu plan.
                </p>
              )}
              {status === 'warning' && (
                <p className="text-xs text-amber-500 font-medium">
                  ⚡ Te estás acercando al límite.
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
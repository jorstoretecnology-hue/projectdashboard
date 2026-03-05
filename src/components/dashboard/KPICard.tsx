import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

/**
 * Nivel Ejecutivo (BI) - KPI Cards
 * 
 * Componente para mostrar métricas críticas del negocio de forma atractiva.
 * Diseñado según las recomendaciones de NotebookLM sobre dashboards jerárquicos.
 */

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function KPICard({ 
  title, 
  value, 
  description, 
  trend, 
  icon: Icon,
  variant = 'default' 
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend.value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600 dark:text-green-400';
    if (trend.value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const variantClasses = {
    default: 'border-border',
    primary: 'border-primary/30 bg-primary/5',
    success: 'border-green-500/30 bg-green-50 dark:bg-green-950/20',
    warning: 'border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20',
    danger: 'border-red-500/30 bg-red-50 dark:bg-red-950/20',
  };

  return (
    <Card className={cn('transition-all hover:shadow-lg', variantClasses[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

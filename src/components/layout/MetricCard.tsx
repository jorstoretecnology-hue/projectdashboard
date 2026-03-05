'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chart?: React.ReactNode;
  className?: string;
}

export const MetricCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  chart,
  className,
}: MetricCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-2">
          {trend && (
            <span
              className={cn(
                "font-medium mr-2",
                trend.isPositive ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
          <span>{description}</span>
        </div>
        
        {chart && (
          <div className="mt-4 h-[60px] w-full">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
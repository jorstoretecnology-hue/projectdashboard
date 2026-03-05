'use client';

import { useEffect, useState, useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineChartProps {
  data: { name: string; value: number }[];
  color?: string;
}

export const SparklineChart = ({ data, color = 'hsl(var(--primary))' }: SparklineChartProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const gradientId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-full w-full bg-muted/20 animate-pulse rounded" />;
  }

  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border border-border px-2 py-1 rounded shadow-sm text-[10px] font-medium">
                    {payload[0].value}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

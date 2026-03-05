import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';

/**
 * Nivel Intermedio (BI) - Trend Visualization
 * 
 * Componente para visualizar tendencias y patrones a lo largo del tiempo.
 * Diseñado según las recomendaciones de NotebookLM sobre dashboards jerárquicos.
 */

interface TrendData {
  label: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  description?: string;
  data: TrendData[];
  dataKey?: string;
  variant?: 'area' | 'line';
  height?: number;
}

export function TrendChart({ 
  title, 
  description, 
  data, 
  dataKey = 'value',
  variant = 'area',
  height = 250
}: TrendChartProps) {
  const Chart = variant === 'area' ? AreaChart : LineChart;
  const ChartComponent = variant === 'area' ? Area : Line;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <Chart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <ChartComponent
              type="monotone"
              dataKey={dataKey}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill={variant === 'area' ? 'url(#colorValue)' : undefined}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            />
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

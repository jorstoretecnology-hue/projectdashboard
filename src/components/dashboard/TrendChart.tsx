import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  {
    ssr: false,
    loading: () => <div className="h-[250px] animate-pulse bg-muted rounded-lg" />,
  },
);

const ChartLoader = ({ variant }: { variant: 'area' | 'line' }) => {
  const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart));
  const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart));

  return variant === 'area' ? <AreaChart /> : <LineChart />;
};

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
  height = 250,
}: TrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {variant === 'area' ? (
              <DynamicAreaChart data={data} dataKey={dataKey} />
            ) : (
              <DynamicLineChart data={data} dataKey={dataKey} />
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DynamicAreaChart({ data, dataKey }: { data: TrendData[]; dataKey: string }) {
  const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
  const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
  const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
  const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
  const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
    ssr: false,
  });
  const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });

  return (
    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
      <Tooltip
        contentStyle={{
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
        }}
      />
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        fill="url(#colorValue)"
        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
      />
    </AreaChart>
  );
}

function DynamicLineChart({ data, dataKey }: { data: TrendData[]; dataKey: string }) {
  const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
  const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });
  const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
  const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
  const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
    ssr: false,
  });
  const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });

  return (
    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
      <Tooltip
        contentStyle={{
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
        }}
      />
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
      />
    </LineChart>
  );
}

'use client';

import { 
  DollarSign, 
  Clock,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { useTenant } from '@/providers';
import { KPICard } from './KPICard';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStatsData {
  daily_sales_total: number;
  daily_sales_count: number;
  avg_lead_time_minutes: number;
  active_service_orders: number;
}

export function DashboardStats() {
  const { currentTenant } = useTenant();
  const [data, setData] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      // Necesitamos el ID del tenant para filtrar la vista
      if (!currentTenant?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data: stats, error: supabaseError } = await supabase
          .from('v_dashboard_stats')
          .select('tenant_id, daily_sales_total, daily_sales_count, avg_lead_time_minutes, active_service_orders')
          .eq('tenant_id', currentTenant.id)
          .single();

        if (supabaseError) throw supabaseError;
        setData(stats);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        console.error('Error fetching dashboard stats:', error.message);
        setError('No se pudieron cargar las estadísticas reales');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [currentTenant?.id]);

  const activeModules = currentTenant?.active_modules || currentTenant?.activeModules || [];

  const statsItems = useMemo(() => {
    if (!data) return [];
    
    const items = [];

    // 1. Ingresos de Hoy (Si tiene módulo de ventas)
    if (activeModules.includes('Sales') || activeModules.includes('sales')) {
      items.push({
        id: 'revenue',
        title: 'Ventas de Hoy',
        value: `$${(data.daily_sales_total || 0).toLocaleString()}`,
        icon: DollarSign,
        description: `${data.daily_sales_count || 0} transacciones hoy`,
        variant: 'success' as const
      });
    }

    // 2. Lead Time (Trazabilidad - Siempre visible para mostrar el motor)
    items.push({
      id: 'lead_time',
      title: 'Lead Time Promedio',
      value: `${Math.round(data.avg_lead_time_minutes || 0)} min`,
      icon: Clock,
      description: 'Promedio de ciclo (7d)',
      variant: 'primary' as const
    });

    // 3. Órdenes Activas (Si es taller/servicios)
    if (activeModules.includes('Services') || activeModules.includes('services')) {
      items.push({
        id: 'active_orders',
        title: 'Órdenes Activas',
        value: (data.active_service_orders || 0).toString(),
        icon: Wrench,
        description: 'Servicios en proceso',
        variant: 'warning' as const
      });
    }

    return items;
  }, [data, activeModules]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl flex items-center gap-2 text-destructive">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statsItems.map((stat) => (
        <KPICard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
          variant={stat.variant}
        />
      ))}
    </div>
  );
}

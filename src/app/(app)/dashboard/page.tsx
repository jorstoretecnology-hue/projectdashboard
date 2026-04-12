import { Activity, Users, TrendingUp, Package, Layers, DollarSign } from 'lucide-react'


import { KPICard } from '@/components/dashboard/KPICard'
import {
  RecentActivitiesTable,
} from '@/components/dashboard/RecentActivitiesTable'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { createClient } from '@/lib/supabase/server'

import { DashboardHero } from './_components/DashboardHero'
import { ModulesGrid } from './_components/ModulesGrid'
import { ThemeSwitcher } from './_components/ThemeSwitcher'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = user?.app_metadata?.tenant_id as string | undefined

  const [
    { count: inventoryCount },
    { count: customerCount },
    { data: todaySales },
    { data: recentEvents },
  ] = tenantId
    ? await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .is('deleted_at', null),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .is('deleted_at', null),
        supabase
          .from('sales')
          .select('total')
          .eq('tenant_id', tenantId)
          .gte('created_at', new Date().toISOString().split('T')[0])
          .neq('state', 'CANCELADA')
          .is('deleted_at', null),
        supabase
          .from('domain_events')
          .select('id, event_type, entity_type, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(5),
      ])
    : [{ count: 0 }, { count: 0 }, { data: [] }, { data: [] }]

  const metrics = {
    inventoryUsage: inventoryCount ?? 0,
    customerUsage: customerCount ?? 0,
    dailySales: (todaySales ?? []).reduce((acc, s) => acc + (s.total ?? 0), 0),
  }

  return (
    <div className="space-y-8 pb-20 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section Premium */}
      <DashboardHero />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: BI Hierarchy (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* ==================== NIVEL EJECUTIVO: KPIs Críticos ==================== */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Métricas Clave
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="Inventario"
                value={metrics.inventoryUsage}
                description={`items registrados`}
                trend={{
                  value: 12,
                  label: 'vs mes anterior',
                }}
                icon={Package}
                variant="primary"
              />
              <KPICard
                title="Clientes"
                value={metrics.customerUsage}
                description={`clientes activos`}
                trend={{
                  value: 8,
                  label: 'nuevos este mes',
                }}
                icon={Users}
                variant="success"
              />
              <KPICard
                title="Ventas del Día"
                value={new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                }).format(metrics.dailySales)}
                description={metrics.dailySales > 0 ? 'Total facturado hoy' : 'Sin ventas hoy'}
                trend={{ value: 0, label: 'vs ayer' }}
                icon={DollarSign}
                variant="default"
              />
            </div>
          </section>

          {/* ==================== NIVEL INTERMEDIO: Tendencias ==================== */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tendencias
            </h2>
            <TrendChart
              title="Crecimiento Mensual"
              description="Evolución de inventario y clientes en los últimos 6 meses"
              data={[
                { label: 'Ene', value: Math.max(0, metrics.inventoryUsage - 25) },
                { label: 'Feb', value: Math.max(0, metrics.inventoryUsage - 15) },
                { label: 'Mar', value: Math.max(0, metrics.inventoryUsage - 10) },
                { label: 'Abr', value: Math.max(0, metrics.inventoryUsage - 5) },
                { label: 'May', value: metrics.inventoryUsage },
                { label: 'Jun', value: metrics.inventoryUsage + 5 },
              ]}
              variant="area"
            />
          </section>

          {/* ==================== NIVEL DETALLADO: Actividades Recientes ==================== */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Actividad Reciente
            </h2>
            <RecentActivitiesTable
              activities={
                (recentEvents ?? []).map((e) => ({
                  id: e.id,
                  description: `${e.entity_type.replace('_', ' ')}: ${
                    e.event_type.includes('insert') || e.event_type === 'INSERT'
                      ? 'creado'
                      : e.event_type.includes('update') || e.event_type === 'UPDATE'
                        ? 'actualizado'
                        : e.event_type
                  }`,
                  type: (
                    e.event_type.includes('insert') || e.event_type === 'INSERT'
                      ? 'create'
                      : e.event_type.includes('update') || e.event_type === 'UPDATE'
                        ? 'update'
                        : 'other'
                  ) as 'create' | 'update' | 'other',
                  timestamp: new Date(e.created_at ?? Date.now()),
                }))
              }
              maxItems={5}
            />
          </section>

          {/* Módulos Activos */}
          <ModulesGrid />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}

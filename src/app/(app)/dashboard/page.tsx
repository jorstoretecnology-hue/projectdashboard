import { Activity, Users, TrendingUp, Package, Layers, DollarSign } from 'lucide-react'


import { KPICard } from '@/components/dashboard/KPICard'
import {
  RecentActivitiesTable,
  type RecentActivity,
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

  const [{ count: inventoryCount }, { count: customerCount }] = tenantId
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
      ])
    : [{ count: 0 }, { count: 0 }]

  const metrics = {
    inventoryUsage: inventoryCount ?? 0,
    customerUsage: customerCount ?? 0,
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
                value="$0"
                description="Sin transacciones registradas"
                trend={{
                  value: 0,
                  label: 'vs ayer',
                }}
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
                [
                  {
                    id: '1',
                    description: 'Cliente "Acme Corp" creado',
                    type: 'create',
                    timestamp: new Date(Date.now() - 1000 * 60 * 15),
                  },
                  {
                    id: '2',
                    description: 'Producto "Widget Pro" actualizado',
                    type: 'update',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                  },
                  {
                    id: '3',
                    description: 'Inventario ajustado: +50 unidades',
                    type: 'other',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
                  },
                ] as RecentActivity[]
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

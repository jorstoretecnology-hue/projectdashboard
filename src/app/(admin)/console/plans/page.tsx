import { createClient } from '@/lib/supabase/server'
import { CreditCard, Users, Building2, Package, CheckCircle2, MoreVertical, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

interface Plan {
  id: string
  slug: string
  name: string
  price_monthly: number
  max_locations: number | null
  max_users: number | null
}

interface PlanModule {
  plan_slug: string
  module_slug: string
}

interface TenantSubset {
  plan: string | null
}

export default async function PlansPage() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('plans')
    .select('id, slug, name, price_monthly, max_locations, max_users')
    .order('price_monthly', { ascending: true })

  const { data: planModules } = await supabase
    .from('plan_modules')
    .select('plan_slug, module_slug')

  const { data: tenants } = await supabase
    .from('tenants')
    .select('plan')

  // Count tenants per plan
  const planCounts: Record<string, number> = {}
  tenants?.forEach((t: TenantSubset) => {
    if (t.plan) planCounts[t.plan] = (planCounts[t.plan] || 0) + 1
  })

  // Group modules by plan
  const modulesMap: Record<string, string[]> = {}
  planModules?.forEach((pm: PlanModule) => {
    if (!modulesMap[pm.plan_slug]) modulesMap[pm.plan_slug] = []
    modulesMap[pm.plan_slug].push(pm.module_slug)
  })

  const PLAN_COLORS: Record<string, string> = {
    free: 'from-slate-600 to-slate-800',
    starter: 'from-blue-600 to-blue-800',
    professional: 'from-violet-600 to-purple-800',
    enterprise: 'from-amber-600 to-orange-800',
  }

  const MODULE_NAMES: Record<string, string> = {
    dashboard: 'Panel Principal',
    inventory: 'Inventario de Productos',
    customers: 'Gestión de Clientes',
    sales: 'Ventas (POS)',
    purchases: 'Compras a Proveedores',
    reports: 'Reportes Analíticos',
    billing: 'Facturación y Caja',
    settings: 'Configuración',
    users: 'Usuarios y Roles',
    work_orders: 'Órdenes de Trabajo',
    vehicles: 'Registro de Vehículos',
    reservations: 'Gestión de Reservas',
    memberships: 'Suscripciones / Membresías',
    accommodations: 'Control de Alojamientos',
    tables_events: 'Mesas y Eventos'
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <CreditCard className="h-6 w-6 text-amber-500" />
            </div>
            Planes de Suscripción
          </h1>
          <p className="text-slate-400 font-medium">
            {plans?.length || 0} planes configurados
          </p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Nuevo Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans?.map((plan: Plan) => {
          // Sort modules by predefined order to ensure comparison consistency
          const MODULE_ORDER = Object.keys(MODULE_NAMES)
          const modules = (modulesMap[plan.slug] || []).sort((a, b) => {
            const indexA = MODULE_ORDER.indexOf(a)
            const indexB = MODULE_ORDER.indexOf(b)
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
          })
          
          const count = planCounts[plan.slug] || 0
          const isFree = plan.price_monthly === 0;
          const gradient = PLAN_COLORS[plan.slug] || 'from-slate-600 to-slate-800';

          return (
            <Card key={plan.slug} className={cn("bg-slate-900/50 border-slate-800 overflow-hidden flex flex-col hover:border-primary/50 transition-all", isFree && "border-slate-700/50 bg-slate-950")}>
              {/* Highlight bar only for paid plans, or subtle for free */}
              <div className={cn("h-1.5 bg-gradient-to-r", isFree ? "from-slate-700 to-slate-800" : gradient)} />
              
              <CardHeader className="pb-4 pt-5 px-6 relative">
                <div className="flex justify-between items-start mb-2">
                  {isFree ? (
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-800">Gratuito</Badge>
                  ) : (
                    <Badge variant="default" className={cn("bg-gradient-to-r border-0 text-white shadow-sm", gradient)}>Premium</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white -mr-2 -mt-1">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-2xl font-black text-white capitalize">{plan.name}</CardTitle>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter text-white">
                    {isFree ? '$0' : `$${plan.price_monthly.toLocaleString()}`}
                  </span>
                  {!isFree && <span className="text-sm font-medium text-slate-500">/mes</span>}
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6 space-y-6 flex-1">
                {/* Compact Limits */}
                <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
                  <div className="flex items-center gap-1.5" title="Ubicaciones Permitidas">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <span>{plan.max_locations === 0 || plan.max_locations === null ? 'Ilimitado' : `${plan.max_locations} loc.`}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Usuarios Permitidos">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span>{plan.max_users === 0 || plan.max_users === null ? 'Ilimitado' : `${plan.max_users} usr.`}</span>
                  </div>
                </div>

                {/* Modules View */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    Módulos Incluidos ({modules.length})
                  </p>
                  <ul className="space-y-2.5">
                    {modules.slice(0, 5).map((m: string) => (
                      <li key={m} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 className={cn("h-4 w-4 shrink-0 mt-0.5", isFree ? "text-slate-600" : "text-primary/70")} />
                        <span className="capitalize">{MODULE_NAMES[m] || m.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                  {modules.length > 5 && (
                    <p className="text-xs text-slate-500 font-medium pt-1">
                      + {modules.length - 5} módulos adicionales
                    </p>
                  )}
                  {modules.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No hay módulos asignados</p>
                  )}
                </div>
              </CardContent>

              {/* Tenants Using and Actions Footer */}
              <CardFooter className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <div className="p-1.5 rounded-md bg-slate-800/50">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <span><strong className="text-white">{count}</strong> tenants</span>
                </div>
                <Button variant="outline" size="sm" className="h-8 hover:bg-primary hover:text-primary-foreground hover:border-primary">
                  Editar
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

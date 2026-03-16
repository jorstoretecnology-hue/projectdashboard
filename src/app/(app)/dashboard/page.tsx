'use client';

import { 
  Laptop, 
  Moon, 
  Sun, 
  CheckCircle2, 
  Info, 
  Monitor, 
  Layers, 
  Activity, 
  Users, 
  Zap, 
  TrendingUp,
  ArrowUpRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  Package,
  Settings,
  Palette,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useModuleContext, useTenant } from '@/providers';
import { SparklineChart } from '@/components/layout/SparklineChart';
import { MODULES_CONFIG } from '@/config/modules';
import { tenantDashboardService, type TenantDashboardMetrics } from '@/modules/dashboard/services/tenant-metrics.service';
import { Skeleton } from '@/components/ui/skeleton';

// Nuevos componentes de BI jerárquico
import { KPICard } from '@/components/dashboard/KPICard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { RecentActivitiesTable, type RecentActivity } from '@/components/dashboard/RecentActivitiesTable';

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const { modules, toggleModule } = useModuleContext();
  const { currentTenant } = useTenant();
  const [mounted, setMounted] = React.useState(false);

  // Solucionar desajuste de hidratación para el tema
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [metrics, setMetrics] = React.useState<TenantDashboardMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Cargar métricas reales
  React.useEffect(() => {
    if (currentTenant) {
      tenantDashboardService.getMetrics(currentTenant.id)
        .then(setMetrics)
        .finally(() => setLoading(false));
    }
  }, [currentTenant]);

  // Filtrar los módulos que el tenant tiene realmente contratados
  const contractedModules = useMemo(() => {
    return MODULES_CONFIG.filter(m => currentTenant?.activeModules.includes(m.id));
  }, [currentTenant]);

  return (
    <div className="space-y-8 pb-20 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section Premium */}
      <div className="gradient-hero rounded-[2rem] p-8 sm:p-14 text-primary-foreground shadow-2xl animate-fade-in relative overflow-hidden group border border-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
          <Zap size={320} />
        </div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-md px-4 py-1 text-xs font-bold uppercase tracking-wider">
               {currentTenant?.plan || 'Standard'} Mode
            </Badge>
            <div className="h-1 w-1 bg-white/40 rounded-full" />
            <span className="text-white/60 text-xs font-medium">v2.4.0 Engine</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
              {currentTenant ? `Hola, ${currentTenant.name}` : 'Dashboard Universal'}
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed max-w-2xl font-medium">
              Gestiona tu infraestructura modular con herramientas de monitorización en tiempo real y componentes optimizados.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
             <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl h-12 px-8 font-bold shadow-xl shadow-black/10 text-base">
                Ver Reportes <ArrowUpRight className="ml-2" size={18} />
             </Button>
             <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-2xl h-12 px-8 font-bold backdrop-blur-md">
                Documentación
             </Button>
          </div>
        </div>
      </div>

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
              {loading ? (
                <>
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </>
              ) : (
                <>
                  <KPICard
                    title="Inventario"
                    value={metrics?.inventoryUsage || 0}
                    description={`de ${metrics?.inventoryLimit || '∞'} items disponibles`}
                    trend={{
                      value: 12,
                      label: 'vs mes anterior'
                    }}
                    icon={Package}
                    variant="primary"
                  />
                  <KPICard
                    title="Clientes"
                    value={metrics?.customerUsage || 0}
                    description={`de ${metrics?.customerLimit || '∞'} permitidos`}
                    trend={{
                      value: 8,
                      label: 'nuevos este mes'
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
                      label: 'vs ayer'
                    }}
                    icon={DollarSign}
                    variant="default"
                  />
                </>
              )}
            </div>
          </section>

          {/* ==================== NIVEL INTERMEDIO: Tendencias ==================== */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tendencias
            </h2>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <TrendChart
                title="Crecimiento Mensual"
                description="Evolución de inventario y clientes en los últimos 6 meses"
                data={[
                  { label: 'Ene', value: Math.max(0, (metrics?.inventoryUsage || 50) - 25) },
                  { label: 'Feb', value: Math.max(0, (metrics?.inventoryUsage || 50) - 15) },
                  { label: 'Mar', value: Math.max(0, (metrics?.inventoryUsage || 50) - 10) },
                  { label: 'Abr', value: Math.max(0, (metrics?.inventoryUsage || 50) - 5) },
                  { label: 'May', value: (metrics?.inventoryUsage || 50) },
                  { label: 'Jun', value: (metrics?.inventoryUsage || 50) + 5 },
                ]}
                variant="area"
              />
            )}
          </section>

          {/* ==================== NIVEL DETALLADO: Actividades Recientes ==================== */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Actividad Reciente
            </h2>
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <RecentActivitiesTable
                activities={[
                  {
                    id: '1',
                    description: 'Cliente "Acme Corp" creado',
                    type: 'create',
                    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
                  },
                  {
                    id: '2',
                    description: 'Producto "Widget Pro" actualizado',
                    type: 'update',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                  },
                  {
                    id: '3',
                    description: 'Inventario ajustado: +50 unidades',
                    type: 'other',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
                  },
                ] as RecentActivity[]}
                maxItems={5}
              />
            )}
          </section>

          {/* Módulos Activos */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Módulos Activos</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestiona las funcionalidades disponibles para tu organización
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Módulos */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Layers size={20} className="text-primary" /> Módulos del Sistema
                  </h2>
                  <Link href="/settings" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                    Gestionar <ArrowRight size={14} />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contractedModules.map((m) => (
                    <Card key={m.id} className={cn(
                      "border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 group overflow-hidden",
                      !modules[m.id as keyof typeof modules] && "opacity-70 grayscale-[0.5]"
                    )}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "p-3 rounded-xl transition-colors",
                            modules[m.id as keyof typeof modules] ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                          )}>
                            <m.icon size={20} />
                          </div>
                          <Switch 
                            checked={!!modules[m.id as keyof typeof modules]} 
                            onCheckedChange={() => toggleModule(m.id)}
                            className="scale-90"
                          />
                        </div>
                        <h4 className="font-bold text-lg mb-1">{m.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-medium leading-snug">
                          {m.description || "Simplifica tus procesos corporativos con este módulo optimizado."}
                        </p>
                        <Link href={m.path}>
                          <Button variant="ghost" className="w-full justify-between h-9 rounded-lg hover:bg-primary/5 hover:text-primary p-0 px-2 font-bold group-hover:bg-primary/5">
                            Abrir módulo <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sidebar Column: Acciones & Apariencia */}
              <div className="space-y-8">
           
           {/* Quick Actions */}
           <Card className="border-border/50 bg-slate-900 text-white shadow-2xl rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
              <CardHeader>
                 <CardTitle className="text-white flex items-center gap-2">
                    <Zap size={18} className="text-primary" /> Acciones Rápidas
                 </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                 {[
                   { label: 'Nuevo User', icon: Users, path: '/users' },
                   { label: 'Añadir Item', icon: Package, path: '/inventory' },
                   { label: 'Configurar', icon: Settings, path: '/settings' },
                   { label: 'Soporte', icon: ShieldCheck, path: '#' },
                 ].map((act, i) => (
                   <Link key={i} href={act.path}>
                      <button className="w-full flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all gap-2 border border-white/5 hover:border-white/20 hover:-translate-y-1">
                         <act.icon size={20} className="text-primary" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">{act.label}</span>
                      </button>
                   </Link>
                 ))}
              </CardContent>
           </Card>

           {/* Appearance */}
           <Card className="border-border/50 bg-card/50 backdrop-blur-md rounded-3xl">
             <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                   <Palette size={18} className="text-blue-500" /> Tema Global
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                   {[
                     { id: 'light', name: 'Standard Light', icon: Sun },
                     { id: 'dark', name: 'Deep Space Dark', icon: Moon },
                     { id: 'system', name: 'Native OS', icon: Laptop },
                   ].map((t) => (
                     <button
                       key={t.id}
                       onClick={() => setTheme(t.id)}
                       className={cn(
                         "flex items-center justify-between px-4 py-3 rounded-2xl border transition-all font-bold text-sm",
                         mounted && theme === t.id 
                          ? "bg-primary/5 border-primary/50 text-primary shadow-sm" 
                          : "border-transparent bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                       )}
                     >
                       <div className="flex items-center gap-3">
                          <t.icon size={18} />
                          {t.name}
                       </div>
                       {mounted && theme === t.id && <CheckCircle2 size={16} />}
                     </button>
                   ))}
                </div>
             </CardContent>
           </Card>

           {/* Newsletter / Info */}
           <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <h4 className="font-bold text-indigo-500 flex items-center gap-2 mb-2">
                 <Info size={16} /> Beta Features
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                 Estamos implementando la integración con IA para predicciones de stock. Mantente atento a las actualizaciones.
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

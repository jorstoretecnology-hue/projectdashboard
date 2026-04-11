'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CreditCard, DollarSign, Users } from 'lucide-react';
import { MetricCard } from '@/components/layout/MetricCard';
import { SparklineChart } from '@/components/layout/SparklineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant } from '@/providers';
import { useModuleContext } from '@/providers';
import { MODULE_DEFINITIONS } from '@/core/modules/module-registry';
import { Switch } from '@/components/ui/switch';
import { DashboardStats } from '@/components/dashboard/DashboardStats'; // Import new component

// Componente Skeleton para las métricas
function MetricSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-[60px] mb-1" />
        <Skeleton className="h-3 w-[120px]" />
      </CardContent>
    </Card>
  );
}

// Componente Skeleton para el gráfico
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[140px] mb-2" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-[40px]" />
            <Skeleton className="h-3 w-[40px]" />
            <Skeleton className="h-3 w-[40px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente Skeleton para módulos
function ModulesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[120px] mb-2" />
        <Skeleton className="h-4 w-[180px]" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between min-h-[40px]">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton completo del dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-10 pb-16">
      {/* Header */}
      <div className="space-y-0.5">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartSkeleton />
        </div>
        <div className="col-span-3">
          <ModulesSkeleton />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentTenant, isLoading, isSuperAdmin, updateTenant } = useTenant();
  // const { modules, toggleModule, mounted } = useModuleContext(); // DEPRECATED: Using TenantContext directly
  const router = useRouter();
  const [mountedPage, setMountedPage] = useState(false);

  useEffect(() => {
    setMountedPage(true);
    if (!isLoading && isSuperAdmin) {
      router.push('/console');
    }
  }, [isLoading, isSuperAdmin, router]);

  // Mostrar skeleton mientras carga
  if (isLoading || !mountedPage || !currentTenant) {
    return <DashboardSkeleton />;
  }

  // Datos para el gráfico de sparkline (Mocked for now, but safer)
  const chartData = [
    { name: 'Lun', value: 10 },
    { name: 'Mar', value: 20 },
    { name: 'Mié', value: 15 },
    { name: 'Jue', value: 25 },
    { name: 'Vie', value: 30 },
    { name: 'Sáb', value: 28 },
    { name: 'Dom', value: 35 },
  ];

  /* 
   * Manejo seguro de módulos activos
   * Usamos el estado del TenantContext que es la fuente de verdad del Plan/Tenant
   */
  const activeModules = currentTenant.active_modules || currentTenant.activeModules || [];

  const handleToggleModule = (moduleId: string) => {
    const isCurrentlyActive = activeModules.includes(moduleId);
    let newModules = [];
    
    if (isCurrentlyActive) {
      newModules = activeModules.filter(m => m !== moduleId);
    } else {
      newModules = [...activeModules, moduleId];
    }
    
    // Optimistic update via Context (DB persistence is handled inside updateTenant)
    updateTenant(currentTenant.id, { activeModules: newModules });
  };

  return (
    <div className="space-y-6 p-4 md:p-10 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">
          Bienvenido a {currentTenant?.name}
        </h2>
        <p className="text-muted-foreground">
          Panel de control para tu negocio de tipo {currentTenant?.industryType}
        </p>
      </div>

      {/* Métricas Dinámicas */}
      <DashboardStats />

      {/* Contenido principal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico de ventas recientes */}
        <div className="col-span-4">
          <SparklineChart data={chartData} />
        </div>

        {/* Módulos disponibles - Control Real */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Módulos Disponibles</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configuración de tu Plan {currentTenant.plan}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {Object.values(MODULE_DEFINITIONS).map((module) => {
                  const nav = module.navigation[0]
                  if (!nav) return null
                  const isCore = ['dashboard', 'settings'].includes(module.key);
                  const isActive = activeModules.includes(module.key) || isCore;
                  const canToggle = !isCore;

                  return (
                    <div
                      key={module.key}
                      className="flex items-center justify-between min-h-[40px]"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-md ${isActive ? 'bg-primary/10' : 'bg-muted/50'}`}>
                          <span className={`text-xs font-mono ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            {nav.icon?.slice(0, 2) ?? '??'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {nav.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {isActive ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggleModule(module.key)}
                        disabled={!canToggle}
                        className="ml-2"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

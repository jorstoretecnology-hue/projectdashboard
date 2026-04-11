'use client';

import {
  Building2,
  Users,
  Package,
  Crown,
  CheckCircle2,
  XCircle,
  Calendar,
  Globe,
  TrendingUp,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Zap,
  ShieldCheck,
  Activity,
  Settings,
  UserPlus,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MODULE_DEFINITIONS } from '@/core/modules/module-registry';
import { PLAN_INFO, type PlanType } from '@/config/tenants';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers';
import { SparklineChart } from '@/components/layout/SparklineChart';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TenantCreateDialog } from '@/components/admin/TenantCreateDialog';
import { InvitationDialog } from '@/components/admin/InvitationDialog';

export default function SuperAdminPage() {
  const { 
    setCurrentTenant, 
    isSuperAdmin, 
    setIsSuperAdmin, 
    tenants, 
    updateTenant 
  } = useTenant();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<{ id: string, name: string } | null>(null);

  // Filtrado de tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterPlan === 'all' || t.plan === filterPlan;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterPlan, tenants]);

  // Estadísticas generales dinámicas
  const stats = useMemo(() => {
    const active = tenants.filter(t => t.isActive);
    return {
      totalTenants: tenants.length,
      activeTenants: active.length,
      totalUsers: tenants.reduce((sum, t) => sum + (t.maxUsers || 0), 0),
      revenue: `$${(active.length * 1250).toLocaleString()}/mes`,
    };
  }, [tenants]);

  const handleSelectTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    setCurrentTenant(tenantId);
    setIsSuperAdmin(false);
    toast.info(`Suplantando sesión como: ${tenant?.name}`);
    window.location.href = '/';
  };

  const handleToggleModule = (tenantId: string, moduleId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const isActive = tenant.activeModules.includes(moduleId);
    const newModules = isActive 
      ? tenant.activeModules.filter(id => id !== moduleId)
      : [...tenant.activeModules, moduleId];

    updateTenant(tenantId, { activeModules: newModules });
    toast.success(`Módulo ${moduleId} ${isActive ? 'desactivado' : 'activado'} para ${tenant.name}`);
  };

  const handleChangePlan = (tenantId: string, newPlan: PlanType) => {
    updateTenant(tenantId, { plan: newPlan });
    toast.success(`Plan de cliente actualizado a ${newPlan.toUpperCase()}`);
  };

  const handleToggleStatus = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    updateTenant(tenantId, { isActive: !tenant.isActive });
    toast.message(
      tenant.isActive ? 'Cuenta Suspendida' : 'Cuenta Reactivada',
      { description: `El cliente ${tenant.name} ahora está ${tenant.isActive ? 'Suspendido' : 'Activo'}` }
    );
  };

  const handleOpenInvite = (tenantId: string, tenantName: string) => {
    setSelectedTenant({ id: tenantId, name: tenantName });
    setIsInviteDialogOpen(true);
  };

  const getPlanBadgeVariant = (plan: PlanType) => {
    switch (plan) {
      case 'enterprise': return 'default';
      case 'professional': return 'secondary';
      case 'starter': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                <Crown size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Console Central</h1>
                <p className="text-slate-400 font-medium">Gestión Global de Infraestructura SaaS</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-full border border-slate-800 w-fit">
              <div 
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer",
                  isSuperAdmin ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                )}
                onClick={() => setIsSuperAdmin(true)}
              >
                <ShieldCheck size={16} />
                <span className="text-sm font-bold">Admin Mode</span>
              </div>
              <div 
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer",
                  !isSuperAdmin ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                )}
                onClick={() => {
                  setIsSuperAdmin(false);
                  toast.info("Modo Usuario activado");
                  setTimeout(() => window.location.href = '/', 500);
                }}
              >
                <Users size={16} />
                <span className="text-sm font-bold">User Mode</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              className="rounded-xl shadow-lg shadow-primary/20 gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus size={18} /> Nuevo Cliente
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-800 bg-slate-900 text-white hover:bg-slate-800 gap-2"
              onClick={() => toast.warning("Acción Requerida", { description: "Selecciona al menos un tenant para realizar una acción masiva." })}
            >
              <Zap size={18} /> Acción Masiva
            </Button>
          </div>
        </div>
      </div>

      <TenantCreateDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      {selectedTenant && (
        <InvitationDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          tenantId={selectedTenant.id}
          tenantName={selectedTenant.name}
        />
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', val: stats.totalTenants, sub: `${stats.activeTenants} activos`, icon: Building2, color: 'text-primary' },
          { label: 'Usuarios Totales', val: stats.totalUsers, sub: 'Capacidad proyectada', icon: Users, color: 'text-blue-500' },
          { label: 'Ingresos Mensuales', val: stats.revenue, sub: '+12% vs eq ant', icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Status Sistema', val: '99.9%', sub: 'Healthy', icon: Activity, color: 'text-orange-500' }
        ].map((item, idx) => (
          <Card key={idx} className="border-border/50 bg-card/40 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.val}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{item.sub}</p>
              <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div 
                   className={cn("h-full rounded-full transition-all duration-1000 bg-current", item.color)} 
                   style={{ width: `${(idx === 0 ? (stats.activeTenants/stats.totalTenants) : 0.7) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-2">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nombre, ID o dominio..." 
            className="pl-10 rounded-xl bg-card border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl">
                <Filter size={16} /> 
                Plan: {filterPlan === 'all' ? 'Todos' : filterPlan.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl">
              <DropdownMenuItem onClick={() => setFilterPlan('all')}>Todos los planes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlan('enterprise')}>Enterprise</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlan('professional')}>Pro</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlan('starter')}>Basic</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlan('free')}>Free</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge variant="secondary" className="h-10 px-4 rounded-xl text-xs font-bold">
            {filteredTenants.length} Resultados
          </Badge>
        </div>
      </div>

      {/* Tenants Grid Premium */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredTenants.map((tenant) => {
          const planInfo = PLAN_INFO[tenant.plan];
          
          return (
            <Card 
              key={tenant.id} 
              className={cn(
                "group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-2xl hover:border-primary/50",
                !tenant.isActive && "opacity-70 grayscale-[0.5]"
              )}
            >
              <div 
                className="absolute top-0 left-0 w-1 h-full opacity-50 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: tenant.branding.primaryColor }}
              />
              
              <CardContent className="p-8 pl-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl transition-transform group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${tenant.branding.primaryColor} 0%, ${tenant.branding.primaryColor} 70%, #fff 150%)` 
                      }}
                    >
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xl tracking-tight">{tenant.name}</h3>
                        {tenant.isActive ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 size={10} /> ACTIVE
                          </div>
                        ) : (
                          <Badge variant="destructive" className="h-5 text-[9px]">OFFLINE</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Globe size={14}/> {tenant.customDomain || 'No domain'}</span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                        <span>ID: {tenant.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => handleSelectTenant(tenant.id)}
                      title="Suplantar usuario"
                    >
                      <ArrowUpRight size={20} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Abrir menú de administración">
                          <MoreVertical size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-48">
                        <DropdownMenuLabel className="font-bold text-xs uppercase text-muted-foreground">Admin Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={() => toast.info(`Configuración para ${tenant.name}`)}><Settings size={14}/> Configuración</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleOpenInvite(tenant.id, tenant.name)}>
                          <UserPlus size={14}/> Invitar Dueño
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleSelectTenant(tenant.id)}><Users size={14}/> Gestionar Usuarios</DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="font-bold text-xs uppercase text-muted-foreground">Cambiar Plan</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleChangePlan(tenant.id, 'starter')}>Plan Basic</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangePlan(tenant.id, 'professional')}>Plan Pro</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangePlan(tenant.id, 'enterprise')}>Plan Enterprise</DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => handleToggleStatus(tenant.id)}
                        >
                          <XCircle size={14}/> {tenant.isActive ? 'Suspender Cuenta' : 'Reactivar Cuenta'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Plan Actual</p>
                        <Badge variant={getPlanBadgeVariant(tenant.plan)} className="font-bold transition-all duration-500 scale-110 origin-left">
                          {planInfo.name.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pricing</p>
                        <p className="font-bold text-primary">{planInfo.price}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Control de Módulos</span>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {tenant.activeModules.length} de {Object.keys(MODULE_DEFINITIONS).length} Activos
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {Object.values(MODULE_DEFINITIONS).map((mod) => {
                          const isActive = tenant.activeModules.includes(mod.key);
                          return (
                            <div 
                              key={mod.key} 
                              className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                                isActive 
                                  ? "bg-primary/5 border-primary/30" 
                                  : "bg-muted/5 border-border/30 opacity-50 hover:opacity-70"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                                  isActive ? "bg-primary/10" : "bg-muted/20"
                                )}>
                                  <span className={cn(
                                    "text-xs font-mono",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                  )}>
                                    {mod.navigation[0]?.icon?.slice(0, 2) ?? '??'}
                                  </span>
                                </div>
                                <Label className="text-xs font-bold cursor-pointer truncate">
                                  {mod.navigation[0]?.label ?? mod.key}
                                </Label>
                              </div>
                              <Switch 
                                checked={isActive} 
                                onCheckedChange={() => handleToggleModule(tenant.id, mod.key)}
                                className="shrink-0 ml-3"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Micro Chart Column */}
                  <div className="bg-muted/20 rounded-2xl p-4 border border-border/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Actividad 7d</span>
                       <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5">+8.4%</Badge>
                    </div>
                    <div className="h-24 w-full">
                      <SparklineChart 
                        data={[
                          { name: 'Lun', value: 40 },
                          { name: 'Mar', value: 30 },
                          { name: 'Mie', value: 45 },
                          { name: 'Jue', value: 35 },
                          { name: 'Vie', value: 55 },
                          { name: 'Sab', value: 48 },
                          { name: 'Dom', value: 60 },
                        ]} 
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <p className="text-muted-foreground">Registro: <span className="font-bold text-foreground ml-1">{tenant.createdAt}</span></p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-primary font-bold"
                        onClick={() => toast.info(`Logs de ${tenant.name}`, { description: "Cargando histórico de eventos de infraestructura..." })}
                      >
                        Ver Logs
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="pt-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
        <div className="w-12 h-1 bg-border rounded-full" />
        <p>© 2026 Dashboard Universal Infrastructure Hub • v1.5.0</p>
      </div>
    </div>
  );
}

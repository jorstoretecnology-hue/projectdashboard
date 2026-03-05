'use client';

import React, { useState } from 'react';
import { 
  Trees, 
  Utensils, 
  TrendingUp, 
  AlertTriangle, 
  Percent, 
  Tent, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  Timer,
  Coffee,
  MoreVertical,
  Navigation,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/providers/TenantContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Mock Data para el PoC
const CABINS = [
  { id: 'C1', name: 'Domo Esmeralda', type: 'Domo Geodésico', status: 'occupied', consumption: 145.00 },
  { id: 'C2', name: 'Cabaña del Bosque', type: 'Cabaña Madera', status: 'available', consumption: 0 },
  { id: 'C3', name: 'Nido de Águila', type: 'Domo Elevado', status: 'cleaning', consumption: 0 },
  { id: 'C4', name: 'Suite Manantial', type: 'Cabaña Premium', status: 'occupied', consumption: 210.50 },
  { id: 'C5', name: 'Domo Galaxia', type: 'Domo Cristal', status: 'available', consumption: 0 },
  { id: 'C6', name: 'Refugio Andino', type: 'Cabaña Piedra', status: 'occupied', consumption: 89.20 },
];

const KITCHEN_ORDERS = [
  { id: 'O1', table: 'Mesa 4', items: '2 Hamburguesas Artesanales + Papas', time: '5 min', status: 'active' },
  { id: 'O2', table: 'Cabaña C1', items: 'Botella de Vino + Tabla de Quesos', time: '12 min', status: 'active' },
  { id: 'O3', table: 'Mesa 2', items: '3 Cafés Americanos + Tarta de Manzana', time: '2 min', status: 'active' },
  { id: 'O4', table: 'Mesa 7', items: 'Parrillada para dos', time: '18 min', status: 'delayed' },
];

export default function DemoGlampingPage() {
  const { currentTenant } = useTenant();

  const isModuleActive = React.useMemo(() => {
    return currentTenant?.activeModules.includes('Inventory');
  }, [currentTenant]);

  if (!isModuleActive) {
    return (
      <div className="h-[70vh] flex items-center justify-center p-6">
        <Card className="max-w-md border-destructive/20 bg-destructive/5 text-center p-12 rounded-[3rem] shadow-2xl">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-destructive" />
          </div>
          <h2 className="text-2xl font-black text-destructive uppercase tracking-tight">Acceso Restringido</h2>
          <p className="text-muted-foreground mt-4 font-medium leading-relaxed">
            El módulo de <strong>Gestión de Cabañas</strong> no está activo para <strong>{currentTenant?.name}</strong>. 
            Contacta con soporte o activa el módulo desde la Consola Central.
          </p>
          <Button 
            className="mt-8 rounded-2xl px-8 font-bold" 
            variant="outline"
            onClick={() => window.history.back()}
          >
            Volver Atrás
          </Button>
        </Card>
      </div>
    );
  }

  const handleCabinClick = (cabin: typeof CABINS[0]) => {
    if (cabin.status === 'occupied') {
      toast.info(`🛒 Consumo total de ${cabin.name}: $${cabin.consumption.toFixed(2)}`, {
        description: 'Cargos acumulados en restaurante y servicios adicionales.'
      });
    } else if (cabin.status === 'cleaning') {
        toast('🧹 Estado: En Limpieza', {
            description: 'Tiempo estimado de finalización: 15 min.'
        });
    } else {
        toast.success(`✅ ${cabin.name} está lista para Check-in.`);
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-10 animate-in fade-in duration-1000">
      
      {/* Header Premium con Branding */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
                    <Trees size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight tracking-tighter sm:text-5xl">
                        {currentTenant?.name} <span className="text-primary font-black">Control</span>
                    </h1>
                    <p className="text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
                        <Sparkles size={12} className="text-primary animate-pulse" /> Panel de Gestión Estratégica v3.0
                    </p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 bg-card/60 backdrop-blur-xl p-4 rounded-[2rem] border border-border/50 shadow-sm">
            <div className="flex -space-x-4">
                {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="user" />
                    </div>
                ))}
            </div>
            <div className="pr-4">
                <p className="text-xs font-black uppercase text-muted-foreground">Personal Activo</p>
                <p className="text-sm font-bold">12 Miembros en turno</p>
            </div>
        </div>
      </div>

      {/* Sección KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Ocupación Actual', value: '82%', sub: '5 de 6 Cabañas', icon: Percent, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Ventas de Hoy', value: '$2,450.00', sub: '+12% vs ayer', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Suministros Críticos', value: '4 Alertas', sub: 'Requiere atención', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((kpi, idx) => (
          <Card key={idx} className="rounded-[2.5rem] border-border/50 bg-card/40 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{kpi.label}</p>
                <p className="text-3xl font-black">{kpi.value}</p>
                <p className="text-xs font-bold text-muted-foreground/60">{kpi.sub}</p>
              </div>
              <div className={cn("p-5 rounded-3xl", kpi.bg, kpi.color)}>
                <kpi.icon size={28} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid: Alojamiento + Restaurante */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sección Alojamiento (Bento Grid) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black flex items-center gap-3">
                <Tent className="text-primary" /> Inventario de Cabañas
            </h2>
            <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2">
                Ver Mapa <Navigation size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CABINS.map((cabin) => (
              <Card 
                key={cabin.id} 
                className={cn(
                    "rounded-[2.5rem] border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden cursor-pointer group transition-all duration-500",
                    cabin.status === 'occupied' ? "hover:border-destructive/40" : cabin.status === 'cleaning' ? "hover:border-amber-500/40" : "hover:border-primary/40"
                )}
                onClick={() => handleCabinClick(cabin)}
              >
                <div className="h-24 bg-muted relative overflow-hidden">
                   <div className={cn(
                       "absolute inset-0 opacity-20",
                       cabin.status === 'occupied' ? "bg-destructive" : cabin.status === 'cleaning' ? "bg-amber-500" : "bg-primary"
                   )} />
                   <div className="absolute top-4 right-4">
                      {cabin.status === 'available' ? (
                          <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg"><CheckCircle2 size={16} /></div>
                      ) : cabin.status === 'occupied' ? (
                          <div className="p-2 bg-destructive rounded-xl text-white shadow-lg"><User size={16} /></div>
                      ) : (
                          <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg"><Timer size={16} /></div>
                      )}
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        {cabin.type.includes('Domo') ? <LayoutGrid size={48} className="opacity-10" /> : <Trees size={48} className="opacity-10" />}
                   </div>
                </div>
                <CardHeader className="p-6 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 leading-none mb-1">{cabin.type}</p>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{cabin.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={cn(
                        "rounded-lg font-black uppercase text-[9px] tracking-widest",
                        cabin.status === 'available' ? "bg-emerald-500/10 text-emerald-600 border-none" : 
                        cabin.status === 'occupied' ? "bg-destructive/10 text-destructive border-none" : 
                        "bg-amber-500/10 text-amber-600 border-none"
                    )}>
                        {cabin.status === 'available' ? 'Disponible' : cabin.status === 'occupied' ? 'Ocupado' : 'Limpieza'}
                    </Badge>
                    {cabin.status === 'occupied' && (
                        <span className="text-xs font-black text-muted-foreground">${cabin.consumption}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sección KDS (Kitchen Display System) */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black flex items-center gap-3">
                    <Utensils className="text-primary" /> Cocina (KDS)
                </h2>
                <Badge className="bg-primary/10 text-primary font-black animate-pulse">4 ACTIVOS</Badge>
            </div>

            <Card className="rounded-[3rem] border-border/50 bg-card/20 backdrop-blur-xl overflow-hidden shadow-inner">
                <CardContent className="p-6 space-y-4">
                    {KITCHEN_ORDERS.map((order) => (
                        <div 
                          key={order.id} 
                          className={cn(
                              "p-5 rounded-[2rem] border transition-all duration-300 relative group overflow-hidden",
                              order.status === 'delayed' ? "bg-destructive/5 border-destructive/20" : "bg-card border-border/50"
                          )}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-black text-primary uppercase text-xs tracking-widest">{order.table}</h3>
                                    <p className="text-xs font-bold mt-1 max-w-[180px]">{order.items}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <Badge variant="outline" className="p-0 h-auto border-none font-black flex items-center gap-1 text-[10px]">
                                        <Clock size={12} className={order.status === 'delayed' ? "text-destructive animate-pulse" : "text-primary"} /> {order.time}
                                    </Badge>
                                    {order.status === 'delayed' && (
                                        <span className="text-[8px] font-bold text-destructive uppercase tracking-widest mt-1">Retrasado</span>
                                    )}
                                </div>
                            </div>
                            <Separator className="bg-border/30 my-3" />
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                        <Coffee size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Prep. por Chef Carlos</span>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-50 group-hover:opacity-100">
                                    <MoreVertical size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <div className="p-6 bg-muted/20 text-center">
                    <Button className="w-full rounded-2xl h-11 font-black gap-2 shadow-xl shadow-primary/10">
                        Abrir Monitor Fullscreen <LayoutGrid size={16} />
                    </Button>
                </div>
            </Card>
        </div>
      </div>

    </div>
  );
}

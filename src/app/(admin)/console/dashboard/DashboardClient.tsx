"use client"

import React from "react"
import {
  Building2,
  Users,
  Package,
  UserCheck,
  ShieldAlert,
  TrendingUp,
  Crown,
  LayoutGrid,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import type {
  GlobalMetrics,
  TenantQuotaStatus,
  PlanDistribution,
  TopConsumer
} from "@/modules/admin/services/saas-metrics.service"
import { MetricCard } from "./MetricCard"
import { TopListCard } from "./TopListCard"
import { CriticalQuotaTable } from "./CriticalQuotaTable"

interface DashboardClientProps {
  data: {
    global: GlobalMetrics
    critical: TenantQuotaStatus[]
    plans: PlanDistribution[]
    topInventory: TopConsumer[]
    topCustomers: TopConsumer[]
  }
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const { global, critical, plans, topInventory, topCustomers } = data
  const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#64748b']

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-[0_8px_16px_-4px_rgba(139,92,246,0.3)] animate-float">
                <Crown className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Executive <span className="text-primary italic">Dashboard</span>
              </h1>
              <p className="text-slate-400 font-medium italic">
                Monitoreo global de infraestructura multi-tenant
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-secondary border-border px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-300">
            SuperAdmin Console
          </Badge>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live Sync
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Tenants"
          value={global.totalTenants}
          icon={Building2}
          trend="+4% vs last month"
          color="primary"
        />
        <MetricCard
          title="Usuarios Activos"
          value={global.totalActiveTenants}
          icon={UserCheck}
          trend="Real-time check"
          color="emerald"
        />
        <MetricCard
          title="Items Globales"
          value={global.totalInventoryItems}
          icon={Package}
          trend="Inventory Load"
          color="blue"
        />
        <MetricCard
          title="Base de Clientes"
          value={global.totalCustomers}
          icon={Users}
          trend="Market Share"
          color="violet"
        />
      </div>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Charts Section */}
        <div className="xl:col-span-2 space-y-8">
           <Card className="bg-card border border-border rounded-[1.5rem] overflow-hidden shadow-sm">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Distribución por Plan
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium mt-1">
                            Análisis de ingresos por nivel de suscripción
                        </CardDescription>
                    </div>
                    <LayoutGrid className="h-5 w-5 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="h-[300px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={plans}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis 
                              dataKey="planName" 
                              stroke="#64748b" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false}
                              tick={{ fill: '#94a3b8' }}
                          />
                          <YAxis 
                              stroke="#64748b" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false}
                              tick={{ fill: '#94a3b8' }}
                          />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Bar 
                              dataKey="count" 
                              radius={[6, 6, 0, 0]} 
                              barSize={45}
                          >
                              {plans.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.8} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
           </Card>

           {/* Critical Quota Card */}
           <CriticalQuotaTable critical={critical} />
        </div>

        {/* Top Lists Sidebar Section */}
        <div className="space-y-8">
            <TopListCard
                title="Top Inventory"
                data={topInventory}
                icon={Package}
                color="blue"
            />
            <TopListCard 
                title="Top Customers" 
                data={topCustomers} 
                icon={Users} 
                color="violet"
            />
            
            <Card className="p-8 bg-card border border-border rounded-[1.5rem] shadow-sm">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-secondary rounded-2xl text-primary">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">System Health</h4>
                        <p className="text-xs text-slate-400 mt-1">Todos los servicios de infraestructura están 100% operativos</p>
                    </div>
                    <div className="w-full flex gap-2">
                        <div className="flex-1 h-1.5 bg-emerald-500/30 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[99%]" />
                        </div>
                    </div>
                </div>
            </Card>
        </div>

      </div>
    </div>
  )
}

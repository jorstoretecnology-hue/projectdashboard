"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  Users,
  Package,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Crown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  saasMetricsService,
  type GlobalMetrics,
  type TenantQuotaStatus,
  type PlanDistribution,
  type TopConsumer,
} from "@/modules/admin/services/saas-metrics.service"

/**
 * SaaS Executive Dashboard
 * Vista analítica global para SuperAdmin.
 * Read-only, métricas reales desde Quota Engine.
 */
export default function SaasExecutiveDashboard() {
  // State
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null)
  const [criticalTenants, setCriticalTenants] = useState<TenantQuotaStatus[]>([])
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([])
  const [topInventory, setTopInventory] = useState<TopConsumer[]>([])
  const [topCustomers, setTopCustomers] = useState<TopConsumer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all metrics
  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [global, critical, plans, invTop, custTop] = await Promise.all([
          saasMetricsService.getGlobalMetrics(),
          saasMetricsService.getCriticalQuotaTenants(),
          saasMetricsService.getPlanDistribution(),
          saasMetricsService.getTopConsumers("maxInventoryItems", 5),
          saasMetricsService.getTopConsumers("maxCustomers", 5),
        ])
        setGlobalMetrics(global)
        setCriticalTenants(critical)
        setPlanDistribution(plans)
        setTopInventory(invTop)
        setTopCustomers(custTop)
      } catch (err) {
        console.error(err)
        setError("Error al cargar métricas del sistema")
      } finally {
        setIsLoading(false)
      }
    }
    loadMetrics()
  }, [])

  const getStatusBadge = (status: TenantQuotaStatus["status"]) => {
    switch (status) {
      case "exceeded":
        return <Badge variant="destructive">Exceeded</Badge>
      case "warning":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Warning</Badge>
      default:
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">OK</Badge>
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-primary/10 text-primary border-primary/20"
      case "professional":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "starter":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Ejecutivo */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SaaS Executive Dashboard</h1>
            <p className="text-muted-foreground">
              Global usage & quota monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
            SuperAdmin Only
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Real-time Data
          </Badge>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* GLOBAL METRICS CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Tenants */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Tenants
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold">{globalMetrics?.totalTenants ?? 0}</div>
            )}
          </CardContent>
        </Card>

        {/* Active Tenants */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Activos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold text-emerald-500">
                {globalMetrics?.totalActiveTenants ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Inventory */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Items Inventario
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {globalMetrics?.totalInventoryItems.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Clientes Total
            </CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {globalMetrics?.totalCustomers.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Near Limit */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Near Limit
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <div className="text-2xl font-bold text-amber-500">
                {globalMetrics?.tenantsNearLimit ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exceeded */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Exceeded
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {globalMetrics?.tenantsExceeded ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ============================================================ */}
      {/* CRITICAL QUOTA TENANTS TABLE */}
      {/* ============================================================ */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Quota Critical Tenants
          </CardTitle>
          <CardDescription>
            Tenants con uso de quota ≥80% o excedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : criticalTenants.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No hay tenants en estado crítico</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead className="text-right">Uso</TableHead>
                  <TableHead className="text-right">Límite</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalTenants.map((tenant, idx) => (
                  <TableRow key={`${tenant.tenantId}-${tenant.resource}-${idx}`}>
                    <TableCell className="font-medium">{tenant.tenantName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPlanBadgeColor(tenant.plan)}>
                        {tenant.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tenant.resource}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tenant.currentUsage}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {tenant.limit}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(tenant.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* TWO COLUMN LAYOUT: TOP CONSUMERS + PLAN DISTRIBUTION */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Inventory Consumers */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-blue-500" />
              Top 5 - Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topInventory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {topInventory.map((consumer, idx) => (
                  <div key={consumer.tenantId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">
                        {idx + 1}.
                      </span>
                      <span className="text-sm font-medium">{consumer.tenantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{consumer.usage}</span>
                      {consumer.limit > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {consumer.percentUsed}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers Consumers */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-violet-500" />
              Top 5 - Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((consumer, idx) => (
                  <div key={consumer.tenantId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">
                        {idx + 1}.
                      </span>
                      <span className="text-sm font-medium">{consumer.tenantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{consumer.usage}</span>
                      {consumer.limit > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {consumer.percentUsed}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* PLAN DISTRIBUTION TABLE */}
      {/* ============================================================ */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribución por Plan
          </CardTitle>
          <CardDescription>
            Conteo real de tenants por nivel de suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Tenants</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planDistribution.map((dist) => (
                  <TableRow key={dist.plan}>
                    <TableCell>
                      <Badge variant="outline" className={getPlanBadgeColor(dist.plan)}>
                        {dist.planName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {dist.count}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {dist.percentage}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

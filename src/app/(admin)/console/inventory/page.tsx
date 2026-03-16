"use client"

import { useMemo, useState, useEffect } from "react"
import { Package, Building2, Calendar, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTenant } from "@/providers"
import { PLAN_INFO, type PlanType } from "@/config/tenants"
import { superAdminStatsService, type TenantQuotaStats } from "@/core/superadmin/stats.service"

/**
 * SuperAdmin Inventory Page
 * Vista agregada de todos los inventarios por tenant.
 * Read-only, sin acciones de creación/edición.
 * Usa métricas REALES desde QuotaEngine.
 */
export default function SuperAdminInventoryPage() {
  const { tenants } = useTenant()
  
  // Estado de métricas reales
  const [quotaStats, setQuotaStats] = useState<TenantQuotaStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar métricas reales
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const stats = await superAdminStatsService.getAllTenantsQuotaStats()
        setQuotaStats(stats)
      } catch (err) {
        console.error(err)
        setError("Error al cargar métricas")
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  // Combinar tenants config con métricas reales
  const inventoryStats = useMemo(() => {
    return tenants.map((tenant) => {
      // Buscar métricas reales para este tenant
      const realStats = quotaStats.find((q) => q.tenantId === tenant.id)
      
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        plan: tenant.plan,
        totalItems: realStats?.inventoryItems ?? 0, // Métrica REAL
        lastUpdated: realStats?.lastUpdated 
          ? new Date(realStats.lastUpdated).toLocaleDateString("es-CO")
          : "Sin datos",
        isActive: tenant.isActive,
      }
    })
  }, [tenants, quotaStats])

  // Totales globales (reales)
  const globalStats = useMemo(() => {
    const active = inventoryStats.filter((s) => s.isActive)
    return {
      totalItems: inventoryStats.reduce((sum, s) => sum + s.totalItems, 0),
      activeTenants: active.length,
      tenantsWithInventory: inventoryStats.filter((s) => s.totalItems > 0).length,
    }
  }, [inventoryStats])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventario Global</h1>
            <p className="text-muted-foreground">
              Métricas reales de inventarios por tenant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
            Admin View • Read Only
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Datos en tiempo real
          </Badge>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items Global
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{globalStats.totalItems.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registrados en el sistema
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tenants Activos
            </CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{globalStats.activeTenants}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Con módulo Inventory
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Con Inventario
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{globalStats.tenantsWithInventory}</div>
                <p className="text-xs text-muted-foreground mt-1">Tenants con items</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Inventario por Tenant
          </CardTitle>
          <CardDescription>
            Uso real de inventario desde Quota Engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Total Items</TableHead>
                  <TableHead className="text-right">Última Actualización</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryStats.map((stat) => {
                  const planInfo = PLAN_INFO[stat.plan as PlanType]
                  return (
                    <TableRow key={stat.tenantId}>
                      <TableCell className="font-medium">{stat.tenantName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {planInfo?.name || stat.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {stat.totalItems.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        <span className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          {stat.lastUpdated}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

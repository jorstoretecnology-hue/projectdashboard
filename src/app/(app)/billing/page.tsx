"use client"

import { useMemo, useState } from "react"
import { useTenant } from "@/providers"
import { PLAN_INFO, type PlanType } from "@/config/tenants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, RotateCcw, ShieldAlert, CheckCircle2, XCircle, Info } from "lucide-react"

import { CurrentPlanBanner } from "@/components/billing/CurrentPlanBanner"
import { QuotaOverview } from "@/components/billing/QuotaOverview"
import { PlanCard } from "@/components/billing/PlanCard"
import { UpgradePlanDialog } from "@/components/billing/UpgradePlanDialog"
import { PaymentHistory } from "@/components/billing/PaymentHistory"
import { usePlanUpgrade } from "@/hooks/use-plan-upgrade"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEffect } from "react"
import { tenantDashboardService, type TenantDashboardMetrics } from "@/modules/dashboard/services/tenant-metrics.service"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export default function BillingPage() {
  const { currentTenant } = useTenant()
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const [showStatusAlert, setShowStatusAlert] = useState(!!status)

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setShowStatusAlert(false)
        // Limpiar URL sin recargar
        router.replace('/billing')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [status, router])

  // 1. Guard Clause: Verificación de módulo "Billing"
  // Nota: Se asume que el módulo se llama "Billing" en la configuración del tenant.
  const isModuleActive = useMemo(() => {
    // Si 'Billing' no está explícitamente en activeModules, verificamos si es 'Settings' 
    // o asumimos que todo tenant tiene acceso a ver su billing (Core feature).
    // Siguiendo la instrucción estricta de "patrón Inventory":
    return currentTenant?.activeModules?.includes("Billing")
  }, [currentTenant])

  // 2. Hook de Simulación de Upgrade (Paso 3)
  const { upgradePlan, resetSimulation, effectivePlan, isSimulated, isPending } = usePlanUpgrade()
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [targetPlan, setTargetPlan] = useState<PlanType | null>(null)

  // Datos del plan actual (basado en simulación)
  const currentPlanInfo = useMemo(() => {
    if (!effectivePlan) return null
    return PLAN_INFO[effectivePlan as PlanType]
  }, [effectivePlan])

  const handleUpgradeClick = (planKey: string) => {
    setTargetPlan(planKey as PlanType)
    setUpgradeDialogOpen(true)
  }

  const handleUpgradeConfirm = async () => {
    if (targetPlan) await upgradePlan(targetPlan)
  }

  const [metrics, setMetrics] = useState<TenantDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar métricas reales
  useEffect(() => {
    if (currentTenant) {
      tenantDashboardService.getMetrics(currentTenant.id)
        .then(setMetrics)
        .finally(() => setLoading(false))
    }
  }, [currentTenant])

  // Datos de cuotas dinámicos
  const quotaData = useMemo(() => [
    {
      key: "users",
      title: "Usuarios",
      description: "Usuarios activos en la plataforma",
      used: metrics?.activeUsers || 0,
      limit: currentPlanInfo?.maxUsers || 1,
    },
    {
      key: "inventory",
      title: "Inventario",
      description: "Productos y servicios registrados",
      used: metrics?.inventoryUsage || 0,
      limit: metrics?.inventoryLimit || 0,
    },
    {
      key: "customers",
      title: "Clientes",
      description: "Cartera de clientes",
      used: metrics?.customerUsage || 0,
      limit: metrics?.customerLimit || 0,
    },
  ], [metrics, currentPlanInfo])

  // 2. Render de Bloqueo si no activo
  if (!isModuleActive) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Facturación no disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            No tienes acceso al módulo de facturación. Contacta a tu administrador.
          </CardContent>
        </Card>
      </div>
    )
  }

  // 3. Render Principal
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Facturación & Planes</h1>
          <p className="text-lg text-muted-foreground">
            Gestiona tu suscripción, métodos de pago y límites de uso.
          </p>
        </div>

        {/* Alertas de Estado de Pago */}
        {showStatusAlert && status === 'success' && (
          <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>¡Pago Exitoso!</AlertTitle>
            <AlertDescription>
              Tu suscripción se ha actualizado correctamente.
            </AlertDescription>
          </Alert>
        )}

        {showStatusAlert && status === 'failure' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Pago Fallido</AlertTitle>
            <AlertDescription>
              No pudimos procesar tu pago. Por favor intenta de nuevo.
            </AlertDescription>
          </Alert>
        )}

        {showStatusAlert && status === 'pending' && (
          <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <Info className="h-4 w-4" />
            <AlertTitle>Pago en Proceso</AlertTitle>
            <AlertDescription>
              Tu pago está pendiente de confirmación. Te avisaremos pronto.
            </AlertDescription>
          </Alert>
        )}

        {/* Banner de Simulación */}
        {isSimulated && (
          <Alert variant="warning" className="border-amber-500/50 bg-amber-500/10">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-base font-semibold">Modo Simulación Activo</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span className="text-sm">
                Estás visualizando los límites y features del plan <strong>{effectivePlan}</strong>. No se han aplicado cargos.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetSimulation} 
                className="ml-4 h-9 border-amber-500/30 hover:bg-amber-500/20"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Revertir
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Grid Principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Plan Actual */}
          <div className="lg:col-span-1">
            {currentPlanInfo ? <CurrentPlanBanner planInfo={currentPlanInfo} /> : null}
          </div>

          {/* Uso de Cuotas */}
          <div className="lg:col-span-2 space-y-6">
            <QuotaOverview quotas={quotaData} />
            <PaymentHistory />
          </div>
        </div>

        {/* Planes Disponibles */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Planes Disponibles</h2>
            <p className="text-muted-foreground">
              Elige el plan que mejor se adapte a las necesidades de tu negocio
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(PLAN_INFO).map(([key, info]) => (
              <PlanCard
                key={key}
                planKey={key as PlanType}
                planInfo={info}
                isCurrent={key === effectivePlan}
                onUpgrade={handleUpgradeClick}
              />
            ))}
          </div>
        </div>

        {/* Información Adicional */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿Necesitas un plan personalizado o tienes preguntas sobre facturación?
              </p>
              <Button variant="link" className="h-auto p-0">
                Contacta con nuestro equipo de ventas →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Upgrade */}
      {effectivePlan && targetPlan && (
        <UpgradePlanDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          currentPlan={effectivePlan as PlanType}
          targetPlan={targetPlan}
          onConfirm={handleUpgradeConfirm}
          isLoading={isPending}
        />
      )}
    </div>
  )
}

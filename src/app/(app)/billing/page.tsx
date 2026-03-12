"use client"

import { useMemo, useState } from "react"
import { useTenant } from "@/providers"
import { PLAN_INFO, type PlanType } from "@/config/tenants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, RotateCcw, ShieldAlert } from "lucide-react"

import { CurrentPlanBanner } from "@/components/billing/CurrentPlanBanner"
import { QuotaOverview } from "@/components/billing/QuotaOverview"
import { PlanCard } from "@/components/billing/PlanCard"
import { UpgradePlanDialog } from "@/components/billing/UpgradePlanDialog"
import { usePlanUpgrade } from "@/hooks/use-plan-upgrade"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function BillingPage() {
  const { currentTenant } = useTenant()

  // 1. Guard Clause: Verificación de módulo "Billing"
  // Nota: Se asume que el módulo se llama "Billing" en la configuración del tenant.
  const isModuleActive = useMemo(() => {
    // Si 'Billing' no está explícitamente en activeModules, verificamos si es 'Settings' 
    // o asumimos que todo tenant tiene acceso a ver su billing (Core feature).
    // Siguiendo la instrucción estricta de "patrón Inventory":
    return currentTenant?.activeModules?.includes("Billing")
  }, [currentTenant])

  // 2. Hook de Simulación de Upgrade (Paso 3)
  const { upgradePlan, resetSimulation, effectivePlan, isSimulated } = usePlanUpgrade()
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

  // Datos mockeados para QuotaOverview (Paso 3)
  const quotaMock = [
    {
      key: "users",
      title: "Usuarios",
      description: "Usuarios activos en la plataforma",
      used: 4,
      limit: currentPlanInfo?.maxUsers ?? 5,
    },
    {
      key: "inventory",
      title: "Inventario",
      description: "Productos y servicios registrados",
      used: 124,
      limit: 500,
    },
    {
      key: "customers",
      title: "Clientes",
      description: "Cartera de clientes",
      used: 42,
      limit: "unlimited" as const,
    },
  ]

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
          <div className="lg:col-span-2">
            <QuotaOverview quotas={quotaMock} />
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
        />
      )}
    </div>
  )
}

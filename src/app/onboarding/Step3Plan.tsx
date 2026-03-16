"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Check, Star, Building2, Zap, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/client"
import { createTenantAction } from "./actions"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"

interface Plan {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  icon: LucideIcon
  color: string
  popular?: boolean
}

interface Step3PlanProps {
  name: string
  selectedIndustry: string
  selectedPlan: string
  onPlanSelect: (plan: string) => void
  onBack: () => void
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    description: 'Perfecto para empezar',
    features: ['10 Clientes', '20 Productos', 'Soporte Básico'],
    icon: Building2,
    color: 'bg-slate-800',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'Para negocios en crecimiento',
    features: ['100 Clientes', '200 Productos', 'CRM Avanzado', 'Soporte Prioritario'],
    icon: Zap,
    color: 'bg-blue-600',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Business',
    price: '$99',
    description: 'Poder ilimitado',
    features: ['Clientes Ilimitados', 'Inventario Ilimitado', 'API Access', 'Gerente de Cuenta'],
    icon: Shield,
    color: 'bg-indigo-600',
  },
]

export function Step3Plan({ name, selectedIndustry, selectedPlan, onPlanSelect, onBack }: Step3PlanProps) {
  const [loading, setLoading] = useState(false)

  const handleCreateTenant = async () => {
    if (!name.trim() || !selectedIndustry) return

    setLoading(true)
    try {
      logger.log("[Onboarding] Creating tenant", { name, plan: selectedPlan, industry: selectedIndustry })

      const tenantId = await createTenantAction(name, selectedPlan, selectedIndustry.toLowerCase())

      logger.log("[Onboarding] Tenant created", { tenantId })
      toast.success(`Organización creada con plan ${selectedPlan.toUpperCase()}`)

      const supabase = createClient()
      await supabase.auth.refreshSession().catch(e => logger.warn("[Onboarding] Error refrescando sesión", { error: e }))

      window.location.href = "/dashboard"
    } catch (err: any) {
      if (err?.digest?.includes('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        return
      }
      logger.error("[Onboarding] Error creating tenant", { error: err })
      toast.error(err.message || "Error al crear la organización")
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-8">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          onClick={() => onPlanSelect(plan.id)}
          className={cn(
            "relative cursor-pointer transition-all hover:scale-105 border-slate-800 bg-slate-900/50 backdrop-blur-xl",
            selectedPlan === plan.id
              ? "ring-2 ring-blue-500 border-transparent bg-slate-800/80"
              : "opacity-70 hover:opacity-100"
          )}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={10} fill="currentColor" /> Recomendado
            </div>
          )}
          <CardHeader>
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-white",
                plan.color
              )}
            >
              <plan.icon size={20} />
            </div>
            <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              <span className="text-slate-400 text-sm">/mes</span>
            </div>
            <CardDescription className="text-slate-400 text-xs">{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <Check size={14} className="text-green-500" /> {feature}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <div
              className={cn(
                "w-full h-4 rounded-full flex items-center justify-center",
                selectedPlan === plan.id ? "text-blue-400" : "text-transparent"
              )}
            >
              {selectedPlan === plan.id && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
            </div>
          </CardFooter>
        </Card>
      ))}

      <div className="col-span-1 md:col-span-3 flex justify-center gap-4 mt-8">
        <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
          Atrás
        </Button>
        <Button
          onClick={handleCreateTenant}
          className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-lg font-bold min-w-[200px]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando...
            </>
          ) : (
            `Comenzar con ${PLANS.find(p => p.id === selectedPlan)?.name}`
          )}
        </Button>
      </div>
    </div>
  )
}

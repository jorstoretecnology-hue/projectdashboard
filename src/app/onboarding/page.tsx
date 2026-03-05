"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building2, Check, Zap, Shield, Star, Store, Utensils, ShoppingCart, Hammer, Dumbbell, Tent, Music } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createTenantAction } from "./actions"
import { cn } from "@/lib/utils"
// Importamos la configuración de industrias y tipos
import { getAllIndustries } from "@/config/industries"
import type { IndustryType } from "@/config/industries"

// Definición de Planes
const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    description: 'Perfecto para empezar',
    features: ['10 Clientes', '20 Productos', 'Soporte Básico'],
    icon: Building2,
    color: 'bg-slate-800'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'Para negocios en crecimiento',
    features: ['100 Clientes', '200 Productos', 'CRM Avanzado', 'Soporte Prioritario'],
    icon: Zap,
    color: 'bg-blue-600',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Business',
    price: '$99',
    description: 'Poder ilimitado',
    features: ['Clientes Ilimitados', 'Inventario Ilimitado', 'API Access', 'Gerente de Cuenta'],
    icon: Shield,
    color: 'bg-indigo-600'
  }
]

export default function OnboardingPage() {
  const params = useSearchParams()
  // Paso 1: Nombre, Paso 2: Industria, Paso 3: Plan
  const [step, setStep] = useState(1) 
  const [name, setName] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null)
  
  // Si viene ?plan=pro en la URL, lo preseleccionamos
  const [selectedPlan, setSelectedPlan] = useState<string>(params.get('plan') || 'free')
  const [loading, setLoading] = useState(false)
  
  const industries = getAllIndustries()

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (step === 1) {
      if (!name.trim()) {
        toast.error("Por favor ingresa un nombre para tu negocio")
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!selectedIndustry) {
        toast.error("Por favor selecciona una industria")
        return
      }
      setStep(3)
    }
  }

  const handleCreateTenant = async () => {
    if (!name.trim() || !selectedIndustry) return

    setLoading(true)
    try {
      // Pasamos el nombre, el plan Y la industria seleccionada
      // @ts-ignore - Validated by type safety in actions but let's be explicit
      await createTenantAction(name, selectedPlan, selectedIndustry.toLowerCase())
      
      toast.success(`Organización creada con plan ${selectedPlan.toUpperCase()}`)
      
      // Forzar actualización inmediata del token
      const supabase = createClient()
      const { error } = await supabase.auth.refreshSession()
      
      if (error) console.warn("Error refrescando sesión:", error)

      // Navegación dura al dashboard
      window.location.href = "/dashboard"
    } catch (err: any) {
      if (err.message === 'NEXT_REDIRECT' || err.message?.includes('NEXT_REDIRECT')) {
        return
      }
      console.error(err)
      toast.error(err.message || "Error al crear la organización")
      setLoading(false)
    }
  }

  const getIndustryIcon = (iconChar: string) => {
    // Mapeo simple de emojis a Iconos Lucide (Mejora visual)
    switch(iconChar) {
      case '🔧': return Hammer;
      case '🍽️': return Utensils;
      case '🛒': return ShoppingCart;
      case '🔨': return Hammer;
      case '💪': return Dumbbell;
      case '🏕️': return Tent;
      case '🕺': return Music;
      default: return Store;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
      
      <div className="z-10 w-full max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Configura tu Negocio</h1>
          <p className="text-slate-400">
            Paso {step} de 3: {step === 1 ? 'Identidad' : step === 2 ? 'Industria' : 'Selecciona tu Plan'}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
             <div 
               className="h-full bg-blue-500 transition-all duration-500 ease-out" 
               style={{ width: `${(step / 3) * 100}%` }}
             />
          </div>
        </div>

        {/* STEP 1: NOMBRE */}
        {step === 1 && (
          <Card className="w-full max-w-md mx-auto border-slate-800 bg-slate-900/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/10 text-blue-500 ring-1 ring-blue-500/20">
                <Building2 size={32} />
              </div>
              <CardTitle className="text-xl text-white">¿Cómo se llama tu empresa?</CardTitle>
            </CardHeader>
            <form onSubmit={handleNextStep}>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="tenantName" className="text-slate-200">Nombre del Proyecto</Label>
                  <Input
                    id="tenantName"
                    placeholder="Ej: Taller Mecánico FastFix"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="border-slate-700 bg-slate-950 text-white h-12 text-lg"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold" disabled={!name.trim()}>
                  Continuar
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* STEP 2: INDUSTRIA */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {industries.map((ind) => {
                 const Icon = getIndustryIcon(ind.icon);
                 // Hack para obtener el key del objeto config desde el value (reverse lookup o prop)
                 // Como getAllIndustries devuelve array de cofigs, necesitamos saber su Key (taller, restaurante...)
                 // Por ahora usamos el nombre para inferir o añadimos key al config.
                 // Vamos a iterar entries mejor en el futuro, por ahora asumimos el nombre mapeado o usamos un identificador en el click.
                 // FIX: INDUSTRIES_CONFIG es un objeto, getAllIndustries pierde el key.
                 // Mejor hardcodeamos keys aqui o modificamos getAllIndustries.
                 // Vamos a asumir que podemos identificarlo por nombre o icon por ahora, pero lo ideal es pasar el Key.
                 
                 // Workaround: Buscar el key en INDUSTRIES_CONFIG entries
                 const indKey = Object.entries(require('@/config/industries').INDUSTRIES_CONFIG).find(([_, val]) => val === ind)?.[0] as IndustryType;

                 return (
                  <Card 
                    key={ind.name}
                    onClick={() => setSelectedIndustry(indKey)}
                    className={cn(
                      "cursor-pointer transition-all hover:scale-105 border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col items-center justify-center py-6 gap-3",
                      selectedIndustry === indKey ? "ring-2 ring-blue-500 border-transparent bg-slate-800" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white bg-slate-800", selectedIndustry === indKey && "bg-blue-600")}>
                      <Icon size={24} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-white text-sm">{ind.name}</h3>
                    </div>
                  </Card>
                 )
              })}
            </div>
            
            <div className="flex justify-center gap-4">
               <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:text-white">
                 Atrás
               </Button>
               <Button 
                onClick={() => handleNextStep()} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold"
                disabled={!selectedIndustry}
               >
                 Siguiente
               </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PLAN */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-8">
             {PLANS.map((plan) => (
               <Card 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "relative cursor-pointer transition-all hover:scale-105 border-slate-800 bg-slate-900/50 backdrop-blur-xl",
                    selectedPlan === plan.id ? "ring-2 ring-blue-500 border-transparent bg-slate-800/80" : "opacity-70 hover:opacity-100"
                  )}
               >
                 {plan.popular && (
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full flex items-center gap-1">
                     <Star size={10} fill="currentColor" /> Recomendado
                   </div>
                 )}
                 <CardHeader>
                   <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-white", plan.color)}>
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
                    <div className={cn(
                      "w-full h-4 rounded-full flex items-center justify-center",
                      selectedPlan === plan.id ? "text-blue-400" : "text-transparent"
                    )}>
                      {selectedPlan === plan.id && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                 </CardFooter>
               </Card>
             ))}

             <div className="col-span-1 md:col-span-3 flex justify-center gap-4 mt-8">
               <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-400 hover:text-white">
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
        )}
      </div>
    </div>
  )
}

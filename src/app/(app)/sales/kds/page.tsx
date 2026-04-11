"use client"

import { useTenant } from "@/providers"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { UtensilsCrossed, PlusCircle, Monitor } from "lucide-react"
import { useState } from "react"

const KDSBoard = dynamic(() => import("@/components/sales/KDSBoard").then(mod => mod.KDSBoard), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
})

const POSDialog = dynamic(() => import("@/components/sales/POSDialog").then(mod => mod.POSDialog), {
  loading: () => null,
  ssr: false
})

export default function KDSPage() {
  const { currentTenant } = useTenant()
  const [isPOSOpen, setIsPOSOpen] = useState(false)

  if (!currentTenant) return null

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-background">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            Control de Pedidos (KDS)
          </h1>
          <p className="text-muted-foreground text-sm">
            Pantalla operativa para Cocina / Taller en tiempo real.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsPOSOpen(true)}
            className="font-bold shadow-md bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KDSBoard tenantId={currentTenant.id} />
      </div>

      <POSDialog 
        open={isPOSOpen} 
        onOpenChange={setIsPOSOpen} 
        tenantId={currentTenant.id}
      />
    </div>
  )
}

"use client"

import { ShoppingBag, TrendingUp, Calendar, Loader2, Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { POSDialog } from "@/components/sales/POSDialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscriptionBlockedOverlay } from "@/components/ui/SubscriptionBlockedOverlay"
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard"
import { cn } from "@/lib/utils"
import { salesService } from "@/modules/sales/services/sales.service"
import type { Sale } from "@/modules/sales/types"

interface SalesClientProps {
  initialSales: Sale[]
  tenantId: string
}

export function SalesClient({ initialSales, tenantId }: SalesClientProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [isLoading, setIsLoading] = useState(false)
  const [isPOSOpen, setIsPOSOpen] = useState(false)
  const { state, canAccess, quotaRemaining } = useSubscriptionGuard('sales')

  const loadSales = async () => {
    setIsLoading(true)
    try {
      const { data } = await salesService.list(tenantId, { limit: 10 })
      setSales(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = sales.reduce((acc, s) => acc + s.total, 0)
    const pending = sales.filter(s => s.state === 'PENDIENTE' || s.state === 'EN_PROCESO').length
    return { total, pending }
  }, [sales])

  return (
    <div className="space-y-6 relative min-h-[60vh]">
      {!canAccess && state !== 'loading' && (
        <SubscriptionBlockedOverlay />
      )}

      {state === 'quota_warning' && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-500 text-amber-900 absolute top-0 left-0 right-0 z-40 shadow-md">
          <AlertTitle className="font-bold">¡Atención! Cuota de ventas casi agotada</AlertTitle>
          <AlertDescription>
            Te queda muy poca cuota de ventas en tu plan actual. Por favor, actualiza tu suscripción o adquiere un paquete adicional para evitar bloqueos.
            {quotaRemaining !== null && <span className="font-bold ml-2">({quotaRemaining} ventas restantes)</span>}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Gestiona tus transacciones y movimientos de caja.</p>
        </div>
        <Button 
          onClick={() => setIsPOSOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" /> Nueva Venta
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy (Demo)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% vs ayer</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Activos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">En espera de cocina</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial Reciente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Últimas Transacciones</CardTitle>
          <button 
            onClick={loadSales}
            disabled={isLoading}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />} Refrescar
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold">
                      {sale.metadata?.mesa ? `Mesa #${sale.metadata.mesa}` : `Orden #${sale.id.slice(0,5)}`}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> {new Date(sale.created_at).toLocaleDateString()} 
                      <span className="opacity-30">|</span> 
                      {sale.payment_method}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-black text-lg">${sale.total.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{sale.items?.length || 0} productos</div>
                  </div>
                  <Badge className={cn(
                    "font-bold text-[10px]",
                    sale.state === 'ENTREGADO' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  )}>
                    {sale.state}
                  </Badge>
                </div>
              </div>
            ))}
            
            {sales.length === 0 && !isLoading && (
              <div className="py-20 text-center text-muted-foreground italic">No hay ventas registradas aún.</div>
            )}
            
            {isLoading && sales.length === 0 && (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>
            )}
          </div>
        </CardContent>
      </Card>

      <POSDialog 
        open={isPOSOpen} 
        onOpenChange={(open) => {
          setIsPOSOpen(open)
          if (!open) loadSales() // Recargar al cerrar
        }} 
        tenantId={tenantId} 
      />
    </div>
  )
}

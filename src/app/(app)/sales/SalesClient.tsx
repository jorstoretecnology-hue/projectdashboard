"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, TrendingUp, Calendar, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { salesService } from "@/modules/sales/services/sales.service"
import { Sale } from "@/modules/sales/types"
import { Badge } from "@/components/ui/badge"

interface SalesClientProps {
  initialSales: Sale[]
  tenantId: string
}

export function SalesClient({ initialSales, tenantId }: SalesClientProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [isLoading, setIsLoading] = useState(false)

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
    <div className="space-y-6">
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
    </div>
  )
}

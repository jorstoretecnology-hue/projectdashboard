import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getRequiredTenantId } from "@/lib/supabase/auth"
import { salesService } from "@/modules/sales/services/sales.service"
import { SalesClient } from "./SalesClient"

export default async function SalesDashboardPage() {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()

  // 1. Carga Inicial de Datos (Server Side)
  const { data: initialSales } = await salesService.list(tenantId, { limit: 10 })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas y Pedidos</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus transacciones y monitorea el flujo operativo.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/sales/kds">
              <ArrowUpRight className="mr-2 h-4 w-4" /> Ver Pantalla Cocina
            </Link>
          </Button>
          <Button asChild>
            <Link href="/sales/kds">Nueva Venta</Link>
          </Button>
        </div>
      </div>

      <SalesClient 
        initialSales={initialSales ?? []} 
        tenantId={tenantId} 
      />
    </div>
  )
}

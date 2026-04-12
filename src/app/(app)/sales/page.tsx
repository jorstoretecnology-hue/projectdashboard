import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getRequiredTenantId } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import type { Sale } from "@/modules/sales/types"

import { SalesClient } from "./SalesClient"

export default async function SalesDashboardPage() {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()

  // Query Supabase directly from server component
  const { data: salesRows } = await supabase
    .from('sales')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10)

  const initialSales = (salesRows || []) as Sale[]

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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getRequiredTenantId } from "@/lib/supabase/auth"
import { inventoryService } from "@/modules/inventory/services/inventory.service"
import { InventoryClient } from "./InventoryClient"

export default async function InventoryPage() {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()
  
  // 1. Obtener Tenant para validar módulo activo
  const { data: tenant } = await supabase
    .from('tenants')
    .select('active_modules')
    .eq('id', tenantId)
    .single()

  const isModuleActive = tenant?.active_modules?.includes("Inventory") ?? false

  // 2. Guard Clause
  if (!isModuleActive) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Módulo no disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Tu plan actual no incluye el módulo de Inventario.
          </CardContent>
        </Card>
      </div>
    )
  }

  // 3. Carga de Datos (Server Side)
  const { data: initialItems } = await inventoryService.list(tenantId)

  return (
    <div className="p-6">
      <InventoryClient 
        initialItems={initialItems} 
        tenantId={tenantId}
      />
    </div>
  )
}

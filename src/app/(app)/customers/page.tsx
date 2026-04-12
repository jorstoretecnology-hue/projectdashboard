import { Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRequiredTenantId } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import { EnhancedCustomersService } from "@/modules/customers/services/customers.service"

import { CustomersClient } from "./CustomersClient"

export default async function CustomersPage() {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()
  
  // 1. Obtener Tenant para validar módulo activo
  const { data: tenant } = await supabase
    .from('tenants')
    .select('active_modules')
    .eq('id', tenantId)
    .single()

  const isModuleActive = tenant?.active_modules?.includes("Customers") ?? false

  // 2. Guard Clause
  if (!isModuleActive) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Users className="h-5 w-5" />
              Módulo no disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            El módulo de Clientes no está activo en tu plan. Contacta a un administrador.
          </CardContent>
        </Card>
      </div>
    )
  }

  // 3. Carga Inicial de Datos (Server Side)
  const service = new EnhancedCustomersService(supabase)
  const { data: initialCustomers } = await service.list(tenantId)

  return (
    <div className="p-6">
      <CustomersClient 
        initialCustomers={initialCustomers} 
        tenantId={tenantId}
      />
    </div>
  )
}

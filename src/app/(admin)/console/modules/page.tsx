import { createClient } from '@/lib/supabase/server'
import { Package, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface ModuleCatalogItem {
  id: string
  name: string
  slug: string
  description: string | null
  is_available: boolean | null
}

interface ModuleUsage {
  module_slug: string
}

export default async function ModulesPage() {
  const supabase = await createClient()

  const { data: catalog } = await supabase
    .from('modules_catalog')
    .select('id, name, slug, description, is_available')
    .order('name')

  // Count active module usage across tenants
  const { data: usage } = await supabase
    .from('tenant_modules')
    .select('module_slug')
    .eq('is_active', true)

  const usageMap: Record<string, number> = {}
  usage?.forEach((u: ModuleUsage) => {
    usageMap[u.module_slug] = (usageMap[u.module_slug] || 0) + 1
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 rounded-2xl">
            <Package className="h-6 w-6 text-violet-500" />
          </div>
          Catálogo de Módulos
        </h1>
        <p className="text-slate-400 font-medium">
          {catalog?.length || 0} módulos disponibles en la plataforma
        </p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <div className="rounded-md border border-slate-800">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Tenants Usando</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog?.map((mod: ModuleCatalogItem) => {
                  const count = usageMap[mod.slug] || 0
                  return (
                    <TableRow key={mod.slug} className="hover:bg-slate-800/20 border-slate-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package size={16} className="text-primary" />
                          </div>
                          <span className="font-bold text-white">{mod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">{mod.slug}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-[300px] truncate">
                        {mod.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "font-bold",
                          count > 0 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-slate-800 text-slate-500"
                        )}>
                          <Building2 size={12} className="mr-1" /> {count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={mod.is_available ? "default" : "destructive"} className="text-[10px] font-bold">
                          {mod.is_available ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

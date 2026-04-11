import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Building2, Users, Package, ScrollText, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TenantUser {
  id: string
  full_name: string | null
  app_role: string
  created_at: string
}

interface TenantModule {
  module_slug: string
  is_active: boolean
}

interface AuditLog {
  id: string
  entity_type: string
  action: string
  created_at: string
  user_id: string | null
  old_data: unknown
  new_data: unknown
}

interface Industry {
  slug: string
  name: string
  description: string | null
}

interface Specialty {
  slug: string
  name: string
  icon: string | null
}

interface Tenant {
  id: string
  name: string
  is_active: boolean
  industry_type: string | null
  plan: string | null
  created_at: string
  industries?: Industry | Industry[] | null
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch tenant
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select(`
      id, name, is_active, industry_type, plan, created_at,
      industries:industry_type(slug, name, description)
    `)
    .eq('id', id)
    .single()

  const typedTenant = tenant as unknown as Tenant

  if (!tenant || error) return notFound()

  // Fetch users of this tenant
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, app_role, created_at')
    .eq('tenant_id', id)
    .order('created_at', { ascending: true })

  // Fetch active modules
  const { data: modules } = await supabase
    .from('tenant_modules')
    .select('module_slug, is_active')
    .eq('tenant_id', id)

  // Fetch audit logs (last 20)
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('id, entity_type, action, created_at, user_id, old_data, new_data')
    .eq('tenant_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const activeModules = (modules as unknown as TenantModule[])?.filter((m) => m.is_active) || []
  const auditLogsData = (auditLogs as unknown as AuditLog[]) || []

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/console/tenants">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10" aria-label="Volver a tenants">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/80 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xl">
              {tenant.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                {tenant.name}
                {tenant.is_active ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">
                    <CheckCircle2 size={10} className="mr-1" /> ACTIVO
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">INACTIVO</Badge>
                )}
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                ID: {typedTenant.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-900/80 border-slate-800 p-1 h-12">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-primary">
            <Building2 size={16} /> General
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary">
            <Users size={16} /> Usuarios ({users?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2 data-[state=active]:bg-primary">
            <Package size={16} /> Módulos ({activeModules.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 data-[state=active]:bg-primary">
            <ScrollText size={16} /> Auditoría
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Información del Negocio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Nombre', value: typedTenant.name },
                  { label: 'Industria', value: (Array.isArray(typedTenant.industries) ? typedTenant.industries[0]?.name : typedTenant.industries?.name) || typedTenant.industry_type || '-' },
                  { label: 'Plan', value: typedTenant.plan?.toUpperCase() || 'FREE' },
                  { label: 'Creado', value: typedTenant.created_at ? new Date(typedTenant.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' }) : '-' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                    <span className="text-sm text-slate-400 font-medium">{item.label}</span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Usuarios', value: users?.length || 0, color: 'text-blue-400' },
                  { label: 'Módulos Activos', value: activeModules.length, color: 'text-emerald-400' },
                  { label: 'Logs de Auditoría', value: auditLogs?.length || 0, color: 'text-amber-400' },
                  { label: 'Estado', value: tenant.is_active ? 'Activo' : 'Inactivo', color: tenant.is_active ? 'text-emerald-400' : 'text-red-400' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{stat.label}</p>
                    <p className={cn("text-xl font-black mt-1", stat.color)}>{stat.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Miembros del Equipo</CardTitle>
              <CardDescription>Usuarios registrados en esta organización.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Desde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(users as unknown as TenantUser[])?.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-800/20 border-slate-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {user.full_name?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium text-slate-200">{user.full_name || 'Sin nombre'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.app_role === 'OWNER' ? 'default' : 'outline'} className="font-bold">
                            {user.app_role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!users || users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-slate-500">
                          No hay usuarios registrados en este tenant.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Módulos del Tenant</CardTitle>
              <CardDescription>Módulos activos e inactivos para esta organización.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(modules as unknown as TenantModule[])?.map((mod) => (
                  <div
                    key={mod.module_slug}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                      mod.is_active
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/5 border-border/30 opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Package size={16} className={mod.is_active ? "text-primary" : "text-muted-foreground"} />
                      <span className="text-sm font-bold uppercase">{mod.module_slug}</span>
                    </div>
                    <Badge variant={mod.is_active ? "default" : "outline"} className="text-[10px]">
                      {mod.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </Badge>
                  </div>
                ))}
                {(!modules || modules.length === 0) && (
                  <p className="text-slate-500 col-span-full text-center py-8">No hay módulos asignados.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Últimas Acciones</CardTitle>
              <CardDescription>Últimos 20 eventos registrados para este tenant.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogsData.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-800/20 border-slate-800">
                        <TableCell className="text-slate-400 text-sm">
                          {log.created_at ? new Date(log.created_at).toLocaleString('es-CO') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">{log.entity_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.action === 'INSERT' ? 'default' : log.action === 'DELETE' ? 'destructive' : 'secondary'}
                            className="font-bold text-[10px]"
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!auditLogs || auditLogs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-slate-500">
                          No hay logs de auditoría para este tenant.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

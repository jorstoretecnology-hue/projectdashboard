import { createClient } from '@/lib/supabase/server'
import { ScrollText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface AuditLog {
  id: string
  entity_type: string
  entity_id: string | null
  action: string
  old_data: unknown
  new_data: unknown
  created_at: string | null
  user_id: string | null
  tenant_id: string | null
}

export default async function AuditPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`
      id,
      entity_type,
      entity_id,
      action,
      old_data,
      new_data,
      created_at,
      user_id,
      tenant_id
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const actionColors: Record<string, string> = {
    INSERT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <ScrollText className="h-6 w-6 text-rose-500" />
          </div>
          Auditoría del Sistema
        </h1>
        <p className="text-slate-400 font-medium">
          Últimos {logs?.length || 0} eventos registrados
        </p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <div className="rounded-md border border-slate-800">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entity ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: AuditLog) => (
                  <TableRow key={log.id} className="hover:bg-slate-800/20 border-slate-800">
                    <TableCell className="text-slate-400 text-sm whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString('es-CO', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-slate-300">
                        {log.tenant_id || 'Sistema'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">{log.entity_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-bold text-[10px] border", actionColors[log.action] || 'bg-slate-800 text-slate-400')}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs font-mono truncate max-w-[150px]">
                      {log.entity_id || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                      <ScrollText size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-bold">No hay logs de auditoría</p>
                    </TableCell>
                  </TableRow>
                )}
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

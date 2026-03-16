import { ShieldAlert, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { TenantQuotaStatus } from "@/modules/admin/services/saas-metrics.service"

interface CriticalQuotaTableProps {
  critical: TenantQuotaStatus[]
}

export function CriticalQuotaTable({ critical }: CriticalQuotaTableProps) {
  return (
    <Card className="bg-card border border-border rounded-[1.5rem] overflow-hidden shadow-sm">
      <CardHeader className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Quota Critical Tenants
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium mt-1">
              Tenants con uso de recursos ≥80%
            </CardDescription>
          </div>
          {critical.length > 0 && (
            <Badge variant="destructive" className="animate-pulse px-3 py-1 font-bold">
              {critical.length} Alerts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 border-t border-white/5">
        {critical.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 italic font-medium">
            <Zap className="h-12 w-12 mb-4 text-emerald-500/20" />
            Todos los sistemas operando dentro de límites normales
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-8">
                    Name
                  </TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    Resource
                  </TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    Usage
                  </TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-right pr-8">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {critical.map((tenant, idx) => (
                  <TableRow key={idx} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="pl-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm group-hover:text-primary transition-colors">
                          {tenant.tenantName}
                        </span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                          {tenant.plan}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-300 italic">
                      {tenant.resource}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-400">
                      {tenant.currentUsage} / {tenant.limit}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase",
                        tenant.status === 'exceeded'
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      )}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

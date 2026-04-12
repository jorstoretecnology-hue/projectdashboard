'use client'

import { Receipt, AlertCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Payment } from '@/hooks/use-payments';
import { usePayments } from '@/hooks/use-payments'
import { formatCurrency, formatDate } from '@/lib/formatters'

const statusVariants: Record<Payment['status'], { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Pagado', variant: 'default' }, // Greenish in theme
  pending: { label: 'Pendiente', variant: 'secondary' },
  failed: { label: 'Fallido', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'outline' },
}

export function PaymentHistory() {
  const { payments, isLoading, error } = usePayments()

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="h-4 w-4" />
        <p>No se pudo cargar el historial de pagos.</p>
      </div>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Historial de Pagos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-muted/50">
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-muted/30">
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="h-8 w-8 opacity-20" />
                    <p>No hay transacciones registradas.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} className="border-muted/30 hover:bg-muted/50 transition-colors">
                  <TableCell className="text-sm font-medium">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.description}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariants[payment.status]?.variant ?? 'secondary'} className="capitalize">
                      {statusVariants[payment.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

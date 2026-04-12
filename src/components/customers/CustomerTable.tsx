import { MoreHorizontal, Pencil, Trash2, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PERMISSIONS } from '@/config/permissions';
import { formatDate } from '@/lib/formatters';
import type { Customer } from '@/modules/customers/types';
import { useUser } from '@/providers';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  const { can } = useUser();

  const canEdit = can(PERMISSIONS.CUSTOMERS_EDIT);
  const canDelete = can(PERMISSIONS.CUSTOMERS_DELETE);
  const hasActions = canEdit || canDelete;

  const getStatusBadge = (status: string = 'active') => {
    switch (status) {
      case 'active':
        return (
          <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border border-emerald-500/20">
            Activo
          </span>
        );
      case 'lead':
        return (
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border border-primary/20">
            Lead
          </span>
        );
      case 'inactive':
        return (
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border border-border">
            Inactivo
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-bold text-xs uppercase tracking-wider">Cliente / Empresa</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider">Estado</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider">Contacto</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider">Registro</TableHead>
            {hasActions && (
              <TableHead className="text-right font-bold w-[100px] text-xs uppercase tracking-wider">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-muted/20 transition-colors group">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {customer.firstName} {customer.lastName}
                  </span>
                  {customer.companyName && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-[10px] opacity-50" aria-hidden="true">🏢</span> {customer.companyName}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(customer.status)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={12} className="text-primary/60" aria-hidden="true" />
                    <span className="text-muted-foreground">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone size={12} className="text-primary/60" aria-hidden="true" />
                      <span className="text-muted-foreground tabular-nums">{customer.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {customer.createdAt ? formatDate(customer.createdAt) : '-'}
                </div>
              </TableCell>
              {hasActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-background shadow-sm border border-border/50"
                          aria-label="Abrir menú de acciones"
                        >
                          <MoreHorizontal size={14} aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl elevation-3 border-border/50">
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Gestionar</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {canEdit && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors"
                            onClick={() => onEdit(customer)}
                            aria-label={`Editar perfil de ${customer.firstName}`}
                          >
                            <Pencil size={14} aria-hidden="true" /> Editar Perfil
                          </DropdownMenuItem>
                        )}

                        {canDelete && (
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer transition-colors"
                            onClick={() => onDelete(customer)}
                            aria-label={`Eliminar a ${customer.firstName}`}
                          >
                            <Trash2 size={14} aria-hidden="true" /> Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

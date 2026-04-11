'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { Customer } from '@/modules/customers/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser } from '@/providers';
import { PERMISSIONS } from '@/config/permissions';

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
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border border-green-200">
            Activo
          </span>
        );
      case 'lead':
        return (
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border border-blue-200">
            Lead
          </span>
        );
      case 'inactive':
        return (
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border border-gray-200">
            Inactivo
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold">Cliente / Empresa</TableHead>
            <TableHead className="font-bold">Estado</TableHead>
            <TableHead className="font-bold">Contacto</TableHead>
            <TableHead className="font-bold">Registro</TableHead>
            {hasActions && (
              <TableHead className="text-right font-bold w-[100px]">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors group">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {customer.firstName} {customer.lastName}
                  </span>
                  {customer.companyName && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-[10px] opacity-50">🏢</span> {customer.companyName}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(customer.status)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={12} className="text-primary/60" />
                    <span className="text-muted-foreground">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone size={12} className="text-primary/60" />
                      <span className="text-muted-foreground">{customer.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground">
                  {customer.createdAt
                    ? format(new Date(customer.createdAt), "d 'de' MMMM", { locale: es })
                    : '-'}
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
                          className="h-8 w-8 rounded-full hover:bg-background shadow-sm border"
                          aria-label="Abrir menú de acciones"
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl elevation-3">
                        <DropdownMenuLabel className="text-xs">Gestionar Cliente</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {canEdit && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => onEdit(customer)}
                          >
                            <Pencil size={14} /> Editar Perfil
                          </DropdownMenuItem>
                        )}

                        {canDelete && (
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => onDelete(customer)}
                          >
                            <Trash2 size={14} /> Eliminar
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

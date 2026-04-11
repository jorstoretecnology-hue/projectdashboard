'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inventoryItemSchema, type InventoryFormValues } from '@/modules/inventory/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface InventoryFormProps {
  defaultValues?: Partial<InventoryFormValues>;
  onSubmit: (data: InventoryFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function InventoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InventoryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema) as Resolver<InventoryFormValues>,
    defaultValues: {
      name: '',
      type: 'product',
      industry_type: 'taller',
      category: '',
      stock: 0,
      price: 0,
      cost_price: 0,
      ...defaultValues,
    },
  });

  // Watch para Select controlado
  const typeValue = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" {...register('name')} placeholder="Ej: Teclado Mecánico" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select value={typeValue} onValueChange={(val) => setValue('type', val as any)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Producto</SelectItem>
              <SelectItem value="service">Servicio</SelectItem>
              <SelectItem value="room">Habitación</SelectItem>
              <SelectItem value="membership">Membresía</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry_type">Industria</Label>
          <Select
            value={watch('industry_type')}
            onValueChange={(val) => setValue('industry_type', val as any)}
          >
            <SelectTrigger id="industry_type">
              <SelectValue placeholder="Seleccionar industria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="taller">Taller</SelectItem>
              <SelectItem value="restaurante">Restaurante</SelectItem>
              <SelectItem value="supermercado">Supermercado</SelectItem>
              <SelectItem value="ferreteria">Ferretería</SelectItem>
              <SelectItem value="gym">Gimnasio</SelectItem>
              <SelectItem value="glamping">Glamping</SelectItem>
              <SelectItem value="discoteca">Discoteca</SelectItem>
            </SelectContent>
          </Select>
          {errors.industry_type && (
            <p className="text-xs text-destructive">{errors.industry_type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input id="category" {...register('category')} placeholder="Ej: Electrónica" />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU (Opcional)</Label>
          <Input id="sku" {...register('sku')} placeholder="PROD-001" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio de Venta ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_price">Costo ($)</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            {...register('cost_price', { valueAsNumber: true })}
          />
          {errors.cost_price && (
            <p className="text-xs text-destructive">{errors.cost_price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Utilidad / Markup</Label>
          <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50 text-sm font-medium">
            {(() => {
              const p = watch('price') || 0;
              const c = watch('cost_price') || 0;
              if (c === 0) return 'N/A';
              const margin = ((p - c) / c) * 100;
              return `${margin.toFixed(1)}% margen`;
            })()}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock Inicial</Label>
          <Input id="stock" type="number" {...register('stock', { valueAsNumber: true })} />
          {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Detalles del ítem..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </form>
  );
}

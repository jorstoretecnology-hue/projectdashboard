'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import { useTenant } from '@/providers';
import { INDUSTRIES_CONFIG, getIndustryConfig } from '@/config/industries';
import type { Product } from '@/types';

/**
 * Props para el formulario dinámico de inventario
 */
interface DynamicInventoryFormProps {
  /** Producto a editar (null para crear nuevo) */
  product?: Product | null;
  /** Callback cuando se envía el formulario */
  onSubmit: (data: ProductFormData) => void;
  /** Callback para cancelar */
  onCancel?: () => void;
  /** Estado de carga */
  isLoading?: boolean;
}

/**
 * Datos del formulario (sin campos del sistema como id, timestamps)
 */
export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  stock: number | null; // null para stock ilimitado
  category: string;
  sku?: string;
  image?: string;
  metadata: Record<string, any>;
}

/**
 * Formulario dinámico que se adapta a la industria del tenant actual
 */
export const DynamicInventoryForm: React.FC<DynamicInventoryFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { currentTenant } = useTenant();
  const [hasUnlimitedStock, setHasUnlimitedStock] = useState(product ? product.stock === null : false);

  // Obtener configuración de la industria del tenant actual
  const industryConfig = useMemo(() => {
    if (!currentTenant) return null;
    return getIndustryConfig(currentTenant.industryType);
  }, [currentTenant]);

  // Crear esquema de validación dinámico basado en la industria
  const validationSchema = useMemo(() => {
    if (!industryConfig) return z.object({});

    const metadataSchema = z.object(
      Object.fromEntries(
        industryConfig.fields.map(field => [
          field.key,
          field.required ? field.validation || z.any() : (field.validation || z.any()).optional()
        ])
      )
    );

    return z.object({
      name: z.string().min(1, 'Nombre requerido'),
      description: z.string().optional(),
      price: z.number().positive('Precio debe ser positivo'),
      stock: hasUnlimitedStock ? z.null() : z.number().int().nonnegative('Stock debe ser positivo'),
      category: z.string().min(1, 'Categoría requerida'),
      sku: z.string().optional(),
      image: z.string().url().optional(),
      metadata: metadataSchema,
    });
  }, [industryConfig, hasUnlimitedStock]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category,
      sku: product.sku || '',
      image: product.image || '',
      metadata: product.metadata,
    } : {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: '',
      sku: '',
      image: '',
      metadata: {},
    },
  });

  const metadataValues = watch('metadata') || {};

  // Si no hay tenant o configuración de industria, mostrar error
  if (!currentTenant || !industryConfig) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">
            Error: No se pudo cargar la configuración de la industria.
            Verifique que el tenant esté configurado correctamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit(data);
  };

  const renderField = (field: typeof industryConfig.fields[0], index: number) => {
    const fieldName = `metadata.${field.key}` as const;
    const fieldValue = metadataValues[field.key];
    const fieldError = errors.metadata?.[field.key];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="text"
              placeholder={field.placeholder}
              {...register(fieldName)}
              className={fieldError ? 'border-destructive' : ''}
            />
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError.message}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              placeholder={field.placeholder}
              {...register(fieldName, { valueAsNumber: true })}
              className={fieldError ? 'border-destructive' : ''}
            />
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError.message}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue || ''}
              onValueChange={(value) => setValue(fieldName, value)}
            >
              <SelectTrigger className={fieldError ? 'border-destructive' : ''}>
                <SelectValue placeholder={field.placeholder || 'Seleccionar...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError.message}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.key}
              placeholder={field.placeholder}
              {...register(fieldName)}
              className={fieldError ? 'border-destructive' : ''}
            />
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError.message}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Switch
              id={field.key}
              checked={fieldValue || false}
              onCheckedChange={(checked) => setValue(fieldName, checked)}
            />
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{industryConfig.icon}</span>
          {product ? 'Editar' : 'Crear'} Producto - {industryConfig.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Campos base del producto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nombre del producto"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('category') || ''}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {industryConfig.productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción del producto"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { valueAsNumber: true })}
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="Código único"
                {...register('sku')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL de Imagen</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://..."
                {...register('image')}
              />
            </div>
          </div>

          {/* Control de stock */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="unlimited-stock"
                checked={hasUnlimitedStock}
                onCheckedChange={setHasUnlimitedStock}
              />
              <Label htmlFor="unlimited-stock">Stock ilimitado</Label>
            </div>

            {!hasUnlimitedStock && (
              <div className="space-y-2">
                <Label htmlFor="stock">
                  Stock <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="Cantidad disponible"
                  {...register('stock', { valueAsNumber: true })}
                  className={errors.stock ? 'border-destructive' : ''}
                />
                {errors.stock && (
                  <p className="text-sm text-destructive">{errors.stock.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Campos específicos de la industria */}
          {industryConfig.fields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Campos específicos de {industryConfig.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {industryConfig.fields.map((field, index) => renderField(field, index))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')} Producto
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

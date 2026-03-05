"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customerSchema, type CustomerFormValues } from "@/modules/customers/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMemo } from "react"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useTenant } from "@/providers"

import { getIndustryConfig } from "@/config/industries"

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>
  onSubmit: (data: CustomerFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CustomerFormProps) {
  const { currentTenant } = useTenant();
  
  // Obtener configuración de industria para campos dinámicos de clientes
  const industryConfig = currentTenant?.industryType ? getIndustryConfig(currentTenant.industryType) : null;
  const customerFields = industryConfig?.customerFields || [];

  // Construir esquema de validación dinámico combinando el base con los metadatos de la industria
  const dynamicSchema = useMemo(() => {
    if (customerFields.length === 0) return customerSchema;

    const metadataShape: Record<string, z.ZodTypeAny> = {};
    customerFields.forEach(field => {
      // Usar la validación definida en la config o z.any() por defecto
      let fieldSchema = field.validation || z.any();
      
      // Si el campo no es requerido, hacerlo opcional en el esquema
      if (!field.required) {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }
      
      metadataShape[field.key] = fieldSchema;
    });

    return customerSchema.extend({
      metadata: z.object(metadataShape).optional().default({}),
    });
  }, [customerFields]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(dynamicSchema) as any,
    defaultValues: {
      status: "active",
      metadata: {},
      ...(defaultValues as any),
    } as any,
  })

  // Manejador para metadatos dinámicos
  const metadata = watch("metadata" as any) || {};
  const setMetadataValue = (key: string, value: any) => {
    setValue("metadata" as any, { ...metadata, [key]: value });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Sección 1: Información Personal / Básica */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold border-b pb-1 flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-1 rounded">👤</span>
          Datos de Contacto
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input id="firstName" {...register("firstName")} placeholder="Ej: Juan" />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input id="lastName" {...register("lastName")} placeholder="Ej: Pérez" />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email Principal</Label>
            <Input id="email" type="email" {...register("email")} placeholder="juan@ejemplo.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...register("phone")} placeholder="+54 9 11..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              defaultValue={defaultValues?.status || "active"}
              onValueChange={(val) => setValue("status", val as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="lead">Prospecto (Lead)</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sección 2: Información de Empresa */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold border-b pb-1 flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-1 rounded">🏢</span>
          Información Corporativa
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre de la Empresa</Label>
            <Input id="companyName" {...register("companyName")} placeholder="Ej: Tech Solutions S.A." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Identificación Fiscal (RUC/VAT)</Label>
            <Input id="taxId" {...register("taxId")} placeholder="Ej: 20-12345678-9" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Sitio Web</Label>
            <Input id="website" {...register("website")} placeholder="https://www.empresa.com" />
            {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
          </div>
        </div>
      </div>

      {/* Sección Adicional: Metadatos Dinámicos por Industria */}
      {customerFields.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold border-b pb-1 flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-1 rounded">🧩</span>
            Información Específica del Negocio ({industryConfig?.name || 'General'})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {customerFields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Label className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                
                {field.type === 'select' ? (
                  <Select
                    onValueChange={(val) => setMetadataValue(field.key, val)}
                    value={metadata[field.key] || ""}
                  >
                    <SelectTrigger className="bg-muted/30 border-primary/5">
                      <SelectValue placeholder={field.placeholder || "Seleccionar..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    value={metadata[field.key] || ""}
                    onChange={(e) => setMetadataValue(field.key, e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-muted/30 border-primary/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                ) : (
                  <Input 
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder}
                    value={metadata[field.key] || ""}
                    onChange={(e) => setMetadataValue(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    className="bg-muted/30 border-primary/5"
                  />
                )}
                {errors.metadata && (errors.metadata as any)[field.key] && (
                  <p className="text-xs text-destructive mt-1">
                    {(errors.metadata as any)[field.key].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección 3: Logística y Notas */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold border-b pb-1 flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-1 rounded">📍</span>
          Logística y Notas
        </h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección de Entrega / Facturación</Label>
            <Input id="address" {...register("address")} placeholder="Calle, Ciudad, Provincia..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas o Comentarios Internos</Label>
            <Input id="notes" {...register("notes")} placeholder="Detalles sobre preferencias, historial..." />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cliente
        </Button>
      </div>
    </form>
  )
}

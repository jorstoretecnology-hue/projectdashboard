"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getIndustryConfig } from "@/config/industries"
import { createCustomerSchema, type CustomerFormValues } from "@/modules/customers/types"
import { useTenant } from "@/providers"

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>
  onSubmit: (data: CustomerFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  isEdit?: boolean
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEdit = false,
}: CustomerFormProps) {
  const { currentTenant } = useTenant();
  
  // Obtener configuración de industria para campos dinámicos de clientes
  const customerFields = useMemo(() => 
    currentTenant?.industryType ? getIndustryConfig(currentTenant.industryType).customerFields : [],
    [currentTenant?.industryType]
  );

  // Construir esquema de validación dinámico combinando el base con los metadatos de la industria
  const dynamicSchema = useMemo(() => {
    if (customerFields.length === 0) return createCustomerSchema;

    const metadataShape: Record<string, z.ZodTypeAny> = {};
    customerFields.forEach(field => {
      let fieldSchema = field.validation || z.string();
      if (!field.required) {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }
      metadataShape[field.key] = fieldSchema;
    });

    return createCustomerSchema.extend({
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
    resolver: zodResolver(dynamicSchema) as Resolver<CustomerFormValues>,
    defaultValues: {
      status: "active",
      metadata: {},
      ...(defaultValues as Partial<CustomerFormValues>),
    },
  })

  // Manejador para metadatos dinámicos
  const metadata = (watch("metadata") as Record<string, unknown>) || {};
  const setMetadataValue = (key: string, value: unknown) => {
    setValue("metadata", { ...metadata, [key]: value });
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" {...register("name")} placeholder="Ej: Juan Pérez" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email Principal</Label>
            <Input id="email" type="email" {...register("email")} placeholder="juan@ejemplo.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...register("phone")} placeholder="+57 300..." />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              defaultValue={defaultValues?.status || "active"}
              onValueChange={(val) => setValue("status", val as "active" | "lead" | "inactive")}
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

      {/* Sección 2: Información de Identificación */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold border-b pb-1 flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-1 rounded">🆔</span>
          Identificación y Empresa
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="identificationType">Tipo de ID</Label>
            <Select
              defaultValue={defaultValues?.identificationType || "CC"}
              onValueChange={(val) => setValue("identificationType", val as "CC" | "NIT" | "CE" | "RUT" | "PASAPORTE" | "TI" | "OTHER")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CC">Cédula de Ciudadanía (CC)</SelectItem>
                <SelectItem value="NIT">NIT (Empresas)</SelectItem>
                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                <SelectItem value="RUT">RUT</SelectItem>
                <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Número de Documento</Label>
            <Input 
              id="document" 
              {...register("document")} 
              placeholder="Ej: 123456789" 
            />
            {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre de la Empresa (Opcional)</Label>
            <Input id="companyName" {...register("companyName")} placeholder="Ej: Tech Solutions S.A." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">ID Fiscal / RUT (Opcional)</Label>
            <Input id="taxId" {...register("taxId")} placeholder="NIT con dígito de verificación" />
          </div>
        </div>
      </div>

      {/* Sección Adicional: Metadatos Dinámicos por Industria */}
      {customerFields.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold border-b pb-1 flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-1 rounded">🧩</span>
            Información Específca ({industryConfig?.name || 'General'})
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
                    value={(metadata[field.key] as string) || ""}
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
                    value={(metadata[field.key] as string) || ""}
                    onChange={(e) => setMetadataValue(field.key, e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-muted/30 border-primary/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                ) : (
                  <Input 
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder}
                    value={(metadata[field.key] as string | number | undefined) || ""}
                    onChange={(e) => setMetadataValue(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    className="bg-muted/30 border-primary/5"
                  />
                )}
                {errors.metadata && (errors.metadata as Record<string, { message?: string }>)[field.key] && (
                  <p className="text-xs text-destructive mt-1">
                    {(errors.metadata as Record<string, { message?: string }>)[field.key].message}
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
          Ubicación y Notas
        </h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register("address")} placeholder="Calle, Ciudad, Barrio..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas o Comentarios Internos</Label>
            <Input id="notes" {...register("notes")} placeholder="Detalles sobre el cliente..." />
          </div>
        </div>
      </div>

      {/* Ley 1581 - Protección de Datos */}
      {!isEdit && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="data_consent_accepted" 
              onCheckedChange={(checked) => setValue("data_consent_accepted", checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="data_consent_accepted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto la <a href="/politica-privacidad" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">política de tratamiento de datos personales</a>
              </Label>
              <p className="text-xs text-muted-foreground">
                En cumplimiento de la Ley 1581 de 2012 (Habeas Data Colombia).
              </p>
              {errors.data_consent_accepted && (
                <p className="text-xs text-destructive">{errors.data_consent_accepted.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

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
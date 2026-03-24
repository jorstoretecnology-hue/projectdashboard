"use client"

import { useState } from "react"
import { Plus, Building2, ShieldCheck, Zap } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenant } from "@/providers"
import { type IndustryType } from "@/types"

const tenantSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  industryType: z.enum(['taller', 'restaurante', 'supermercado', 'ferreteria', 'gym', 'glamping', 'discoteca']),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
  customDomain: z.string().optional(),
})

type TenantFormValues = z.infer<typeof tenantSchema>

interface TenantCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TenantCreateDialog({ open, onOpenChange }: TenantCreateDialogProps) {
  const { createTenant } = useTenant()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      industryType: "taller",
      plan: "free",
      customDomain: "",
    },
  })

  const onSubmit = async (data: TenantFormValues) => {
    setIsSubmitting(true)
    logger.log("[TenantCreateDialog] Submitting new tenant:", data)
    try {
      const result = await createTenant({
        name: data.name,
        plan: data.plan,
        industryType: data.industryType,
        customDomain: data.customDomain,
        activeModules: ['Dashboard', 'Inventory', 'Customers'], // Módulos básicos por defecto
        maxUsers: data.plan === 'enterprise' ? 999 : (data.plan === 'professional' ? 50 : 10),
      })

      logger.log("[TenantCreateDialog] Success! Created:", result)

      toast.success("Cliente Creado", {
        description: `${data.name} ha sido registrado exitosamente en Supabase.`
      })
      
      onOpenChange(false)
      form.reset()
    } catch (error: unknown) {
      logger.error("[TenantCreateDialog] Submission failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al crear cliente", {
        description: errorMessage || "Verifica los permisos de red o base de datos."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold">Registrar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Configure los detalles básicos de la nueva instancia SaaS.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nombre del Negocio
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Talleres Gomez" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Industria
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 capitalize">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Plan Inicial
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 capitalize">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Dominio Personalizado (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="gomez.dashboard.com" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gap-2 shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creando..." : (
                  <>
                    <Zap className="h-4 w-4" /> Crear Instancia
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

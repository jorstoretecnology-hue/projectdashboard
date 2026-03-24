"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTenant } from "@/providers"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Info, MessageSquare, Send, Save, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

interface Template {
  id?: string
  event_type: string
  channel: string
  template_body: string
  is_active: boolean
}

const AVAILABLE_VARIABLES: Record<string, string[]> = {
  "sale.completed": ["{{cliente_nombre}}", "{{total}}", "{{items_count}}", "{{fecha}}"],
  "service_order.ready": ["{{cliente_nombre}}", "{{vehiculo_placa}}", "{{vehiculo_marca}}", "{{total}}"],
  "product.stock_low": ["{{producto_nombre}}", "{{stock_actual}}", "{{sku}}"]
}

export function NotificationSettings() {
  const { currentTenant } = useTenant()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedEventType, setSelectedEventType] = useState("sale.completed")
  const [currentBody, setCurrentBody] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (currentTenant?.id) {
      loadTemplates()
    }
  }, [currentTenant?.id])

  useEffect(() => {
    const active = templates.find(t => t.event_type === selectedEventType)
    setCurrentBody(active?.template_body || "")
  }, [selectedEventType, templates])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("id, tenant_id, event_type, channel, template_body, is_active, created_at, updated_at")
        .eq("tenant_id", currentTenant?.id)

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      toast.error("Error al cargar plantillas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentTenant?.id) return
    
    setIsSaving(true)
    try {
      const existing = templates.find(t => t.event_type === selectedEventType)
      
      const payload = {
        tenant_id: currentTenant.id,
        event_type: selectedEventType,
        template_body: currentBody,
        channel: "whatsapp" // Default for now
      }

      if (existing?.id) {
        const { error } = await supabase
          .from("notification_templates")
          .update(payload)
          .eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("notification_templates")
          .insert(payload)
        if (error) throw error
      }

      toast.success("Plantilla guardada correctamente")
      loadTemplates()
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const insertVariable = (variable: string) => {
    setCurrentBody(prev => prev + " " + variable)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Personaliza los mensajes automáticos que tus clientes recibirán vía WhatsApp.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Editor de Plantilla */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Evento Disparador</Label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger className="h-12 border-primary/20 bg-background/50">
                    <SelectValue placeholder="Selecciona un evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale.completed">Venta Completada</SelectItem>
                    <SelectItem value="service_order.ready">Reparación Lista (Taller)</SelectItem>
                    <SelectItem value="product.stock_low">Stock Bajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Cuerpo del Mensaje</Label>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Formato WhatsApp</span>
                </div>
                <Textarea 
                  className="min-h-[200px] border-primary/20 bg-background/50 focus-visible:ring-primary font-mono text-sm leading-relaxed"
                  placeholder="¡Hola! Tu orden ha sido procesada..."
                  value={currentBody}
                  onChange={(e) => setCurrentBody(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full h-12 font-black shadow-lg shadow-primary/20"
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
                GUARDAR CONFIGURACIÓN
              </Button>
            </div>

            {/* Panel de Variables y Previsualización */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-4">
                <h4 className="text-xs font-black flex items-center gap-2 text-primary">
                  <Plus className="w-3 h-3" /> VARIABLES DISPONIBLES
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(AVAILABLE_VARIABLES[selectedEventType] || []).map(variable => (
                    <Button 
                      key={variable} 
                      variant="secondary" 
                      size="sm" 
                      className="text-[10px] h-7 bg-card hover:bg-primary/10 border border-primary/5 font-mono"
                      onClick={() => insertVariable(variable)}
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic flex items-start gap-1">
                  <Info className="w-3 h-3 inline mt-0.5" />
                  Haz clic en una variable para insertarla en el mensaje. n8n las reemplazará automáticamente.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#E9EDEF] dark:bg-[#0b141a] border-l-4 border-[#25D366] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Send className="w-12 h-12" />
                </div>
                <h4 className="text-[10px] font-bold text-[#128C7E] mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" /> VISTA PREVIA (WHATSAPP)
                </h4>
                <div className="bg-white dark:bg-[#1f2c33] p-4 rounded-lg shadow-sm text-sm whitespace-pre-wrap leading-tight relative">
                  <div className="absolute top-0 left-0 w-0 h-0 border-t-[10px] border-t-white dark:border-t-[#1f2c33] border-r-[10px] border-r-transparent -ml-2" />
                  {currentBody || <span className="text-muted-foreground italic">Redacta tu mensaje para verlo aquí...</span>}
                  <div className="text-[9px] text-right mt-1 text-muted-foreground">12:00 PM ✓✓</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

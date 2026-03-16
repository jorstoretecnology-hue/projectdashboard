"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, Trash2, Utensils, User, ShoppingCart, Loader2, Camera } from "lucide-react"
import { useTenant } from "@/providers"
import { inventoryService } from "@/modules/inventory/services/inventory.service"
import { InventoryItem } from "@/modules/inventory/types"
import { CreateSaleDTO, CreateSaleItemDTO } from "@/modules/sales/types"
import { salesService } from "@/modules/sales/services/sales.service"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

import { getIndustryConfig } from "@/config/industries"
import { InspectionChecklist } from "./InspectionChecklist"
import { InspectionCamera } from "./InspectionCamera"
import { useDebounce } from 'use-debounce'
import { createClient } from '@/lib/supabase/client'

interface POSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
}

export function POSDialog({ open, onOpenChange, tenantId }: POSDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Seleccion, 2: Inspección, 3: Resumen/Meta
  const [search, setSearch] = useState("")
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearch] = useDebounce(search, 300)
  
  // Estado del pedido
  const [selectedItems, setSelectedItems] = useState<(CreateSaleItemDTO & { name: string })[]>([])
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado de Inspección
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([])
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  
  // Esquema dinámico
  const { currentTenant } = useTenant();
  const industryConfig = currentTenant?.industryType ? getIndustryConfig(currentTenant.industryType) : null;
  const metadataSchema = (currentTenant as any)?.settings?.metadata_schema?.sale || [];

  useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      setIsLoading(true)
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('id, name, price, stock, sku, type')
          .eq('tenant_id', tenantId)
          .ilike('name', `%${debouncedSearch}%`)
          .gt('stock', 0)
          .limit(20)

        if (error) throw error
        setInventory((data as any) ?? [])
      } catch (err) {
        console.error("Error loading inventory:", err)
        toast.error("Error al cargar productos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [debouncedSearch, open, tenantId])

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      setInventory([])
      setSearch('')
      setStep(1)
      setSelectedItems([])
      setMetadata({})
      setInspectionPhotos([])
      setChecklistItems([])
    }
  }, [open])

  const addItem = (item: InventoryItem) => {
    const existing = selectedItems.find(i => i.product_id === item.id)
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.product_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setSelectedItems([...selectedItems, { 
        product_id: item.id, 
        name: item.name, 
        quantity: 1, 
        unit_price: item.price,
        notes: "" 
      }])
    }
    toast.success(`${item.name} añadido`)
  }

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.product_id !== productId))
  }


  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }))
  }

  const handleChecklistToggle = (item: string) => {
    setChecklistItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return toast.error("Añade al menos un producto")
    
    // Validar si hay campos requeridos en el esquema (opcional, todos texto por ahora)
    const missingFields = metadataSchema.filter((field: string) => !metadata[field])
    if (metadataSchema.length > 0 && missingFields.length > 0) {
      return toast.error(`Faltan campos: ${missingFields.join(", ")}`)
    }

    setIsSubmitting(true)
    try {
      // Consolidar todos los metadatos (incluyendo inspección)
      const finalMetadata = {
        ...metadata,
        inspection_checklist: checklistItems,
        inspection_photos: inspectionPhotos, // TODO: Subir a storage antes si es base64
        system_source: 'pos_dynamic'
      }

      const payload: CreateSaleDTO = {
        customer_id: '00000000-0000-0000-0000-000000000000',
        payment_method: 'CASH',
        items: selectedItems.map(({ name, ...rest }) => rest),
        metadata: finalMetadata,
        notes: `Pedido ${metadata['mesa'] ? 'Mesa ' + metadata['mesa'] : 'Venta Realizada'}`
      }
      
      await salesService.create(payload)
      toast.success("¡Pedido enviado correctamente!")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (industryConfig?.requiresInspection) {
        setStep(2)
      } else {
        setStep(3)
      }
    } else if (step === 2) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step === 3) {
      if (industryConfig?.requiresInspection) {
        setStep(2)
      } else {
        setStep(1)
      }
    } else if (step === 2) {
      setStep(1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Nueva Orden {step === 2 && "- Inspección"} {step === 3 && "- Resumen"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {step === 1 ? (
            <>
              {/* Selector de Productos */}
              <div className="flex-1 flex flex-col p-6 border-r bg-muted/5">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar producto o SKU..." 
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-3 content-start">
                  {isLoading ? (
                    <div className="col-span-2 py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : inventory.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="flex flex-col items-start p-3 border rounded-xl bg-card hover:border-primary transition-colors text-left group"
                    >
                      <span className="font-bold text-sm truncate w-full group-hover:text-primary">{item.name}</span>
                      <span className="text-xs text-muted-foreground">${item.price.toLocaleString()}</span>
                      <Badge variant="outline" className="mt-2 text-[9px] uppercase">{item.type}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen Lateral */}
              <div className="w-80 flex flex-col p-6 bg-card">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> Resumen
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {selectedItems.map(item => (
                    <div key={item.product_id} className="text-sm p-2 border rounded-lg bg-muted/30">
                      <div className="flex justify-between font-medium">
                        <span>{item.name}</span>
                        <button onClick={() => removeItem(item.product_id)}><Trash2 className="w-3 h-3 text-destructive" /></button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">{item.quantity} x ${item.unit_price}</span>
                        <span className="font-bold">${(item.quantity * (item.unit_price || 0)).toLocaleString()}</span>
                      </div>
                      <Input 
                        placeholder="Nota (ej: sin sal)" 
                        className="h-7 text-xs mt-2 bg-transparent"
                        value={item.notes}
                        onChange={(e) => {
                          setSelectedItems(selectedItems.map(si => 
                            si.product_id === item.product_id ? { ...si, notes: e.target.value } : si
                          ))
                        }}
                      />
                    </div>
                  ))}
                  {selectedItems.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-xs italic">
                      No hay productos seleccionados
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <div className="flex justify-between font-bold text-lg mb-4">
                    <span>Total</span>
                    <span>${selectedItems.reduce((acc, i) => acc + (i.quantity * (i.unit_price || 0)), 0).toLocaleString()}</span>
                  </div>
                  <Button 
                    className="w-full font-bold" 
                    disabled={selectedItems.length === 0}
                    onClick={nextStep}
                  >
                    Continuar <Plus className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : step === 2 ? (
            /* PASO 2: INSPECCIÓN (Solo si aplica) */
            <div className="flex-1 overflow-y-auto p-10 max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                  <Camera className="w-6 h-6 text-primary" /> Inspección de Entrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Registra el estado actual y captura evidencia visual para seguridad del negocio y del cliente.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Checklist de Recepción</Label>
                    <InspectionChecklist 
                      items={industryConfig?.inspectionConfig?.items || []}
                      completedItems={checklistItems}
                      onItemToggle={handleChecklistToggle}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Evidencia Fotográfica</Label>
                    <InspectionCamera 
                      photos={inspectionPhotos}
                      onPhotosChange={setInspectionPhotos}
                      suggestedPhotos={industryConfig?.inspectionConfig?.suggestedPhotos}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button variant="outline" className="flex-1" onClick={prevStep}>Volver</Button>
                <Button className="flex-[2] font-black" onClick={nextStep}>
                  Continuar a Resumen
                </Button>
              </div>
            </div>
          ) : (
            /* PASO 3: METADATOS / RESUMEN */
            <div className="flex-1 overflow-y-auto p-10 max-w-xl mx-auto space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                  <User className="w-5 h-5 text-primary" /> Información Adicional
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {metadataSchema.length > 0 ? (
                    metadataSchema.map((field: string) => (
                      <div key={field} className="space-y-2">
                        <Label className="capitalize">{field.replace('_', ' ')}</Label>
                        <Input 
                          placeholder={`Ej: ${field}`}
                          value={metadata[field] || ""} 
                          onChange={(e) => handleMetadataChange(field, e.target.value)}
                          className="h-12 border-primary/20 bg-background/50 focus-visible:ring-primary"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-10 text-center text-muted-foreground italic border-2 border-dashed rounded-xl border-primary/5 bg-primary/5">
                      No se requieren datos adicionales para esta industria.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h4 className="font-bold text-sm uppercase text-primary mb-4">Resumen Final</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Items:</span> <span>{selectedItems.length}</span></div>
                  {industryConfig?.requiresInspection && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Inspección:</span> 
                      <span>{checklistItems.length} ítems / {inspectionPhotos.length} fotos</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black border-t pt-2 mt-2">
                    <span>A PAGAR:</span> 
                    <span>${selectedItems.reduce((acc, i) => acc + (i.quantity * (i.unit_price || 0)), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={prevStep}>Volver</Button>
                <Button 
                  className="flex-[2] font-black" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "ENVIAR A COCINA"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


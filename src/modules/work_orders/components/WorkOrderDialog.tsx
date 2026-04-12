'use client';

import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Wrench,
  Car,
  ClipboardCheck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { CustomerSelect } from '@/components/customers/CustomerSelect';
import { InspectionCamera } from '@/components/sales/InspectionCamera';
import { InspectionChecklist } from '@/components/sales/InspectionChecklist';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getIndustryConfig } from '@/config/industries';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/providers';

import { workOrdersService } from '../services/work-orders.service';
import type { WorkOrder, WorkOrderPriority } from '../types';

interface WorkOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (order: WorkOrder) => void;
}

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number | null;
  color: string | null;
  fuel_type: 'GASOLINA' | 'DIESEL' | 'ELECTRICO' | 'HIBRIDO' | 'GAS' | null;
}

const STEPS = [
  { label: 'Vehículo y Cliente', icon: Car },
  { label: 'Inspección', icon: ClipboardCheck },
  { label: 'Confirmación', icon: CheckCircle2 },
] as const;

export function WorkOrderDialog({ open, onClose, onCreated }: WorkOrderDialogProps) {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id ?? '';
  const industryConfig = currentTenant?.industryType
    ? getIndustryConfig(currentTenant.industryType)
    : null;

  // Stepper
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Paso 1 — Datos
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('NORMAL');

  // Paso 2 — Inspección
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar vehículos del cliente seleccionado
  useEffect(() => {
    if (!customerId || !tenantId) {
      setVehicles([]);
      setVehicleId(null);
      return;
    }

    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, brand, model, plate, year, color, fuel_type')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVehicles(data as unknown as VehicleOption[]);
      }
      setLoadingVehicles(false);
    };

    fetchVehicles();
  }, [customerId, tenantId]);

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setStep(0);
      setCustomerId('');
      setVehicleId(null);
      setVehicles([]);
      setName('');
      setDescription('');
      setPriority('NORMAL');
      setPhotoUrls([]);
      setChecklistItems([]);
    }
  }, [open]);

  // Upload de fotos a Supabase Storage en vez de base64
  const handlePhotosChange = async (photos: string[]) => {
    // Si la nueva foto es la última y es base64, subirla
    const lastPhoto = photos[photos.length - 1];
    if (lastPhoto && lastPhoto.startsWith('data:')) {
      setUploadingPhoto(true);
      try {
        const supabase = createClient();
        const timestamp = Date.now();
        const filePath = `${tenantId}/inspections/${timestamp}.jpg`;

        // Convertir base64 a blob
        const res = await fetch(lastPhoto);
        const blob = await res.blob();

        const { error: uploadError } = await supabase.storage
          .from('inspections')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('inspections').getPublicUrl(filePath);

        // Reemplazar el base64 con la URL pública
        const updatedPhotos = [...photoUrls, urlData.publicUrl];
        setPhotoUrls(updatedPhotos);
      } catch (err) {
        toast.error('Error al subir la foto');
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      // Es una eliminación
      setPhotoUrls(photos);
    }
  };

  const handleChecklistToggle = (item: string) => {
    setChecklistItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('El nombre de la orden es obligatorio');
    if (!tenantId) return toast.error('No se pudo determinar el tenant');

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      const order = await workOrdersService.create(tenantId, {
        name,
        description,
        customer_id: customerId || null,
        vehicle_id: vehicleId,
        priority,
        state: 'RECIBIDO',
        received_at: new Date().toISOString(),
        assigned_to: null,
        assigned_at: null,
        created_by: user?.id ?? null,
        diagnosis: null,
        notes: checklistItems.length > 0 ? `Checklist: ${checklistItems.join(', ')}` : null,
        labor_cost: 0,
        parts_cost: 0,
        started_at: null,
        blocked_at: null,
        blocked_reason: null,
        completed_at: null,
        delivered_at: null,
        location_id: null,
      });

      toast.success('Orden de trabajo creada');
      onCreated?.(order);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la orden';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvanceStep0 = name.trim().length > 0;
  // canAdvanceStep1: Inspección es opcional, siempre true

  const nextStep = () => {
    if (step === 0 && canAdvanceStep0) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 1) setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wrench className="w-6 h-6 text-primary" />
            Nueva Orden de Trabajo
          </DialogTitle>
          {/* Stepper */}
          <div className="flex items-center gap-2 pt-3">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    step === i
                      ? 'bg-primary text-primary-foreground'
                      : step > i
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── PASO 0: Vehículo y Cliente ─── */}
          {step === 0 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-2">
                <Label className="font-bold">Cliente</Label>
                <CustomerSelect
                  tenantId={tenantId}
                  value={customerId}
                  onValueChange={setCustomerId}
                />
              </div>

              {customerId && (
                <div className="space-y-2">
                  <Label className="font-bold">Vehículo</Label>
                  {loadingVehicles ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cargando vehículos...
                    </div>
                  ) : vehicles.length > 0 ? (
                    <div className="space-y-2">
                      <UISelect
                        value={vehicleId ?? '__none__'}
                        onValueChange={(v) => setVehicleId(v === '__none__' ? null : v)}
                      >
                        <UISelectTrigger className="h-12">
                          <UISelectValue placeholder="Seleccionar vehículo..." />
                        </UISelectTrigger>
                        <UISelectContent>
                          <UISelectItem value="__none__">Sin vehículo</UISelectItem>
                          {vehicles.map((v) => (
                            <UISelectItem key={v.id} value={v.id}>
                              {v.brand} {v.model} — {v.plate} {v.year ? `(${v.year})` : ''}
                            </UISelectItem>
                          ))}
                        </UISelectContent>
                      </UISelect>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Este cliente no tiene vehículos registrados.
                      <button
                        type="button"
                        onClick={() => setVehicleId(null)}
                        className="ml-1 text-primary font-bold hover:underline"
                      >
                        Continuar sin vehículo
                      </button>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-bold">Nombre de la Orden *</Label>
                <Input
                  placeholder="Ej: Revisión de frenos, Cambio de aceite..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Descripción</Label>
                <Textarea
                  placeholder="Detalla el problema o trabajo solicitado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Prioridad</Label>
                <UISelect
                  value={priority}
                  onValueChange={(v) => setPriority(v as WorkOrderPriority)}
                >
                  <UISelectTrigger className="h-12">
                    <UISelectValue />
                  </UISelectTrigger>
                  <UISelectContent>
                    <UISelectItem value="BAJA">🟢 Baja</UISelectItem>
                    <UISelectItem value="NORMAL">🔵 Normal</UISelectItem>
                    <UISelectItem value="ALTA">🟠 Alta</UISelectItem>
                    <UISelectItem value="URGENTE">🔴 Urgente</UISelectItem>
                  </UISelectContent>
                </UISelect>
              </div>
            </div>
          )}

          {/* ─── PASO 1: Inspección ─── */}
          {step === 1 && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                  <Camera className="w-6 h-6 text-primary" /> Inspección de Entrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Registra el estado actual y captura evidencia visual para seguridad del negocio y
                  del cliente.
                </p>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Checklist de Recepción
                    </Label>
                    <InspectionChecklist
                      items={
                        industryConfig?.inspectionConfig?.items || [
                          'Estado general exterior',
                          'Estado general interior',
                          'Nivel de combustible',
                          'Objetos personales',
                          'Rayones o abolladuras previas',
                        ]
                      }
                      completedItems={checklistItems}
                      onItemToggle={handleChecklistToggle}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Evidencia Fotográfica
                      {uploadingPhoto && (
                        <Badge variant="secondary" className="ml-2">
                          <Loader2 className="w-3 h-3 animate-spin mr-1" /> Subiendo...
                        </Badge>
                      )}
                    </Label>
                    <InspectionCamera
                      photos={photoUrls}
                      onPhotosChange={handlePhotosChange}
                      suggestedPhotos={industryConfig?.inspectionConfig?.suggestedPhotos}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── PASO 2: Confirmación ─── */}
          {step === 2 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Resumen de la Orden
              </h3>

              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="font-bold">{name}</span>
                </div>
                {description && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descripción:</span>
                    <span className="text-right max-w-[60%]">{description}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prioridad:</span>
                  <Badge variant="outline">{priority}</Badge>
                </div>
                {vehicleId && vehicles.find((v) => v.id === vehicleId) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vehículo:</span>
                    <span className="font-medium">
                      {(() => {
                        const v = vehicles.find((vh) => vh.id === vehicleId);
                        return v ? `${v.brand} ${v.model} — ${v.plate}` : '';
                      })()}
                    </span>
                  </div>
                )}
                {checklistItems.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Inspección:</span>
                    <span className="ml-2">{checklistItems.length} ítems marcados</span>
                  </div>
                )}
                {photoUrls.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Fotos:</span>
                    <span className="ml-2">{photoUrls.length} evidencias</span>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {photoUrls.map((url, i) => (
                        <div key={i} className="relative w-full aspect-square rounded-lg border overflow-hidden">
                          <img
                            src={url}
                            alt={`Evidencia ${i + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con navegación */}
        <div className="p-6 border-t flex gap-4">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={prevStep}>
              Volver
            </Button>
          )}
          {step < 2 ? (
            <Button
              className="flex-[2] font-bold"
              onClick={nextStep}
              disabled={step === 0 && !canAdvanceStep0}
            >
              Continuar <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button className="flex-[2] font-black" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 w-4 h-4" /> Creando...
                </>
              ) : (
                'Crear Orden de Trabajo'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

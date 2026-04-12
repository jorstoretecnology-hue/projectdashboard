'use client';

import { Search, Plus, Trash2, User, ShoppingCart, Loader2, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

import { CustomerSelect } from '@/components/customers/CustomerSelect';
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
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import type { InventoryItem } from '@/modules/inventory/types';
import type { CreateSaleDTO, CreateSaleItemDTO, PaymentMethod } from '@/modules/sales/types';
import { useTenant } from '@/providers';
import { salesService } from '@/modules/sales/services/sales.service';

interface POSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export function POSDialog({ open, onOpenChange, tenantId }: POSDialogProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Selección, 2: Resumen/Pago
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearch] = useDebounce(search, 300);

  // Estado del pedido
  const [selectedItems, setSelectedItems] = useState<(CreateSaleItemDTO & { name: string })[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    '00000000-0000-0000-0000-000000000000',
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CASH');
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Esquema dinámico
  const { currentTenant } = useTenant();
  const metadataSchema =
    (currentTenant as { settings?: { metadata_schema?: { sale?: string[] } } })?.settings
      ?.metadata_schema?.sale || [];
  const confirmLabel =
    (currentTenant as { settings?: { pos_confirm_label?: string } })?.settings?.pos_confirm_label ??
    'Confirmar Venta';

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, stock, sku, type, category')
          .eq('tenant_id', tenantId)
          .ilike('name', `%${debouncedSearch}%`)
          .limit(20);

        if (error) throw error;
        setInventory((data as unknown as InventoryItem[]) ?? []);
      } catch (err) {
        logger.error('Error loading inventory in POS', { err, tenantId, search: debouncedSearch });
        toast.error('Error al cargar productos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch, open, tenantId]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      setInventory([]);
      setSearch('');
      setStep(1);
      setSelectedItems([]);
      setMetadata({});
    }
  }, [open]);

  const addItem = (item: InventoryItem) => {
    const existing = selectedItems.find((i) => i.product_id === item.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.product_id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.price,
          notes: '',
        },
      ]);
    }
    toast.success(`${item.name} añadido`);
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.product_id !== productId));
  };

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return toast.error('Añade al menos un producto');

    // Validar si hay campos requeridos en el esquema
    const missingFields = metadataSchema.filter((field: string) => !metadata[field]);
    if (metadataSchema.length > 0 && missingFields.length > 0) {
      return toast.error(`Faltan campos: ${missingFields.join(', ')}`);
    }

    setIsSubmitting(true);
    try {
      const finalMetadata = {
        ...metadata,
        system_source: 'pos_dynamic',
      };

      const payload: CreateSaleDTO = {
        customer_id: selectedCustomerId,
        payment_method: selectedPaymentMethod as PaymentMethod,
        items: selectedItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes,
        })),
        metadata: finalMetadata,
        notes: 'Venta Realizada',
      };

      await salesService.create(payload);
      toast.success('¡Venta registrada correctamente!');
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Nueva Venta {step === 2 && '- Resumen'}
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
                    <div className="col-span-2 py-20 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </div>
                  ) : (
                    inventory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addItem(item)}
                        className="flex flex-col items-start p-3 border rounded-xl bg-card hover:border-primary transition-colors text-left group"
                      >
                        <span className="font-bold text-sm truncate w-full group-hover:text-primary">
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCOP(item.price)}
                        </span>
                        <Badge variant="outline" className="mt-2 text-[9px] uppercase">
                          {item.type}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Resumen Lateral */}
              <div className="w-80 flex flex-col p-6 bg-card">
                <div className="space-y-4 mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Cliente
                  </h3>
                  <CustomerSelect
                    tenantId={tenantId}
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                  />
                </div>

                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Mi Pedido
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="text-sm p-2 border rounded-lg bg-muted/30"
                    >
                      <div className="flex justify-between font-medium">
                        <span>{item.name}</span>
                        <button onClick={() => removeItem(item.product_id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} x {formatCOP(item.unit_price || 0)}
                        </span>
                        <span className="font-bold">
                          {formatCOP(item.quantity * (item.unit_price || 0))}
                        </span>
                      </div>
                      <Input
                        placeholder="Nota (ej: sin sal)"
                        className="h-7 text-xs mt-2 bg-transparent"
                        value={item.notes}
                        onChange={(e) => {
                          setSelectedItems(
                            selectedItems.map((si) =>
                              si.product_id === item.product_id
                                ? { ...si, notes: e.target.value }
                                : si,
                            ),
                          );
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
                    <span>
                      {formatCOP(
                        selectedItems.reduce((acc, i) => acc + i.quantity * (i.unit_price || 0), 0),
                      )}
                    </span>
                  </div>
                  <Button
                    className="w-full font-bold"
                    disabled={selectedItems.length === 0}
                    onClick={() => setStep(2)}
                  >
                    Continuar <Plus className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* PASO 2: METADATOS / RESUMEN */
            <div className="flex-1 overflow-y-auto p-10 max-w-xl mx-auto space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                  <User className="w-5 h-5 text-primary" /> Información Adicional
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Método de Pago
                    </Label>
                    <UISelect
                      value={selectedPaymentMethod}
                      onValueChange={setSelectedPaymentMethod}
                    >
                      <UISelectTrigger className="h-12 border-primary/20 bg-background/50">
                        <UISelectValue placeholder="Efectivo, Tarjeta..." />
                      </UISelectTrigger>
                      <UISelectContent>
                        <UISelectItem value="CASH">Efectivo 💵</UISelectItem>
                        <UISelectItem value="CARD">Tarjeta Cred/Deb 💳</UISelectItem>
                        <UISelectItem value="TRANSFER">Transferencia 🏦</UISelectItem>
                        <UISelectItem value="MERCADOPAGO">Mercado Pago 📲</UISelectItem>
                      </UISelectContent>
                    </UISelect>
                  </div>

                  {metadataSchema.length > 0 ? (
                    metadataSchema.map((field: string) => (
                      <div key={field} className="space-y-2">
                        <Label className="capitalize">{field.replace('_', ' ')}</Label>
                        <Input
                          placeholder={`Ej: ${field}`}
                          value={(metadata[field] as string) || ''}
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
                  <div className="flex justify-between">
                    <span>Items:</span> <span>{selectedItems.length}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black border-t pt-2 mt-2">
                    <span>A PAGAR:</span>
                    <span>
                      {formatCOP(
                        selectedItems.reduce((acc, i) => acc + i.quantity * (i.unit_price || 0), 0),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Volver
                </Button>
                <Button
                  className="flex-[2] font-black"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : confirmLabel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

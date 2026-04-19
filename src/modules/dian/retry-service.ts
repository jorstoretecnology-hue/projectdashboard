'use server';

import { createClient } from '@/lib/supabase/server';

import { createProvider } from './factory';
import type { DianInvoiceInput, DianInvoiceResult } from './types';

const RETRY_CONFIG = {
  maxRetries: 3,
  delayMs: 2000,
  backoffMultiplier: 2,
};

export async function emitInvoiceWithRetry(
  saleId: string,
  tenantId: string,
): Promise<DianInvoiceResult> {
  const supabase = await createClient();

  const { data: config, error: configError } = await supabase
    .from('dian_provider_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (configError || !config) {
    return { success: false, errorMessage: 'Config DIAN no encontrada' };
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*, customer:customers(*), items:sale_items(*)')
    .eq('id', saleId)
    .single();

  if (saleError || !sale) {
    return { success: false, errorMessage: 'Venta no encontrada' };
  }

  const customer = sale.customer as {
    name: string;
    identification_type: string | null;
    identification_number: string | null;
    email: string | null;
  };
  const items =
    (sale.items as Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>) || [];

  const invoiceInput: DianInvoiceInput = {
    saleId: sale.id,
    customer: {
      name: customer.name || 'Cliente',
      idType: (customer.identification_type as 'CC' | 'NIT' | 'CE' | 'PP') || 'CC',
      idNumber: customer.identification_number || '0',
      email: customer.email,
    },
    items: items.map((item) => ({
      description: item.product_name || 'Producto',
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      taxRate: 19,
    })),
    subtotal: Number(sale.subtotal) || 0,
    tax: Number(sale.tax) || 0,
    total: Number(sale.total) || 0,
  };

  await logAttempt(saleId, tenantId, 'pending', invoiceInput);

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const provider = createProvider(config.provider as 'alegra' | 'siigo');
      provider.configure({ apiKey: config.api_key });

      const result = await provider.sendInvoice(invoiceInput);

      if (result.success) {
        await incrementConsecutive(tenantId);

        await supabase
          .from('dian_invoice_logs')
          .update({
            status: 'sent',
            provider_invoice_id: result.providerInvoiceId,
            cude: result.cude,
          })
          .eq('sale_id', saleId);

        await supabase
          .from('sales')
          .update({ dian_status: 'sent', dian_cufe: result.cude })
          .eq('id', saleId);

        return result;
      }

      lastError = result.errorMessage;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Error desconocido';

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.delayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
        await sleep(delay);
      }
    }
  }

  await logAttempt(saleId, tenantId, 'failed', invoiceInput, undefined, lastError);

  await queueForRetry(saleId, tenantId, invoiceInput, lastError!);

  return { success: false, errorMessage: lastError };
}

async function logAttempt(
  saleId: string,
  tenantId: string,
  status: 'pending' | 'sent' | 'failed',
  payload: DianInvoiceInput,
  providerInvoiceId?: string,
  errorMessage?: string,
) {
  const supabase = await createClient();

  await supabase.from('dian_invoice_logs').insert({
    sale_id: saleId,
    tenant_id: tenantId,
    status,
    payload: JSON.stringify(payload),
    provider_invoice_id: providerInvoiceId,
    cude: undefined,
    error_message: errorMessage,
  });
}

async function incrementConsecutive(tenantId: string) {
  const supabase = await createClient();

  await supabase.rpc('increment_dian_consecutive', { p_tenant_id: tenantId });
}

async function queueForRetry(
  saleId: string,
  tenantId: string,
  payload: DianInvoiceInput,
  error: string,
) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (webhookUrl) {
    await fetch(`${webhookUrl}/dian-retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleId,
        tenantId,
        payload,
        error,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

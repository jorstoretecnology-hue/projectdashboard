'use server'

import { getRequiredTenantId } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { encryptSecret, decryptSecret } from './encryption'
import { createProvider } from './factory'
import type {
  ProviderSlug,
  Environment,
  DianInvoiceInput,
  InvoiceLogEntry,
} from './types'

// ─────────────────────────────────────────────────────────────
// Type for the nested query result from Supabase
// ─────────────────────────────────────────────────────────────
type SaleRow = {
  id: string
  subtotal: number | null
  tax: number | null
  total: number
  tenant_id: string
  customer: {
    first_name: string | null
    last_name: string | null
    company_name: string | null
    identification_type: string | null
    identification_number: string | null
    email: string | null
  } | null
  items: {
    product_name: string | null
    quantity: number
    unit_price: number
    subtotal: number
    product: {
      tax_rate: number | null
    } | null
  }[]
}

// ─────────────────────────────────────────────────────────────
// Generic DB escape hatch
// ─────────────────────────────────────────────────────────────

function dianDb(supabase: Awaited<ReturnType<typeof createClient>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ─────────────────────────────────────────────────────────────
// Provider configuration
// ─────────────────────────────────────────────────────────────

export async function saveProviderConfig(
  slug: ProviderSlug,
  environment: Environment,
  credentials: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()

  const encrypted = encryptSecret(credentials)

  const { error } = await dianDb(supabase)
    .from('dian_provider_config')
    .upsert(
      {
        tenant_id: tenantId,
        provider_slug: slug,
        environment,
        credentials_encrypted: encrypted,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,provider_slug,environment' }
    )

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getActiveProvider(): Promise<{
  slug: ProviderSlug | null
  environment: Environment | null
  isConfigured: boolean
} | null> {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()

  const { data, error } = await dianDb(supabase)
    .from('dian_provider_config')
    .select('provider_slug, environment, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    slug: data.provider_slug as ProviderSlug,
    environment: data.environment as Environment,
    isConfigured: true,
  }
}

// ─────────────────────────────────────────────────────────────
// Invoice sending
// ─────────────────────────────────────────────────────────────

export async function sendInvoiceToDian(saleId: string): Promise<{
  success: boolean
  invoiceNumber?: string
  cude?: string
  error?: string
}> {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()

  // 1. Fetch sale with JOIN
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select(`
      id, subtotal, tax, total, tenant_id,
      customer:customers(
        first_name, last_name, company_name,
        identification_type, identification_number, email
      ),
      items:sale_items(
        product_name, quantity, unit_price, subtotal,
        product:products(tax_rate)
      )
    `)
    .eq('id', saleId)
    .eq('tenant_id', tenantId)
    .single()

  if (saleError || !sale) {
    return { success: false, error: saleError?.message ?? 'Sale not found' }
  }

  if (sale.tenant_id !== tenantId) {
    return { success: false, error: 'ACCESO_DENEGADO: Tenant mismatch' }
  }

  // 2. Build saleData from joined result
  const typedSale = sale as unknown as SaleRow

  const customerName = typedSale.customer
    ? `${typedSale.customer.first_name ?? ''} ${typedSale.customer.last_name ?? ''}`.trim() ||
      typedSale.customer.company_name ||
      'Cliente General'
    : 'Cliente General'

  const saleData: DianInvoiceInput = {
    saleId: typedSale.id,
    customer: {
      name: customerName,
      idType: (typedSale.customer?.identification_type as 'CC' | 'NIT' | 'CE' | 'PP') || 'CC',
      idNumber: typedSale.customer?.identification_number || '000000',
      email: typedSale.customer?.email || undefined,
    },
    items: (typedSale.items || []).map((item) => ({
      description: item.product_name || 'Producto',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.product?.tax_rate ?? 19,
    })),
    subtotal: typedSale.subtotal ?? 0,
    tax: typedSale.tax ?? 0,
    total: typedSale.total,
  }

  // 3. Get active provider config
  const providerInfo = await getActiveProvider()
  if (!providerInfo?.slug) {
    await dianDb(supabase).from('dian_invoice_logs').insert({
      tenant_id: tenantId,
      sale_id: saleId,
      provider_slug: null,
      operation: 'send',
      status: 'failed',
      error_message: 'No provider configured for this tenant',
    })
    return { success: false, error: 'No DIAN provider configured' }
  }

  // 4. Decrypt credentials
  const { data: configData } = await dianDb(supabase)
    .from('dian_provider_config')
    .select('credentials_encrypted')
    .eq('tenant_id', tenantId)
    .eq('provider_slug', providerInfo.slug)
    .eq('environment', providerInfo.environment)
    .maybeSingle()

  if (!configData?.credentials_encrypted) {
    await dianDb(supabase).from('dian_invoice_logs').insert({
      tenant_id: tenantId,
      sale_id: saleId,
      provider_slug: providerInfo.slug,
      operation: 'send',
      status: 'failed',
      error_message: 'Provider credentials not found',
    })
    return { success: false, error: 'Provider credentials not configured' }
  }

  const credentials = decryptSecret<Record<string, string>>(configData.credentials_encrypted)
  if (!credentials) {
    await dianDb(supabase).from('dian_invoice_logs').insert({
      tenant_id: tenantId,
      sale_id: saleId,
      provider_slug: providerInfo.slug,
      operation: 'send',
      status: 'failed',
      error_message: 'Failed to decrypt provider credentials',
    })
    return { success: false, error: 'Encryption key mismatch' }
  }

  // 5. Send via provider
  const provider = createProvider(providerInfo.slug)
  provider.configure(credentials)
  const result = await provider.sendInvoice(saleData)

  // 6. Log result
  await dianDb(supabase).from('dian_invoice_logs').insert({
    tenant_id: tenantId,
    sale_id: saleId,
    provider_slug: providerInfo.slug,
    operation: 'send',
    status: result.success ? 'success' : 'failed',
    error_message: result.errorMessage ?? null,
    provider_invoice_id: result.providerInvoiceId ?? null,
    cude: result.cude ?? null,
  })

  return {
    success: result.success,
    invoiceNumber: result.invoiceNumber,
    cude: result.cude,
    error: result.errorMessage,
  }
}

// ─────────────────────────────────────────────────────────────
// Provider logs
// ─────────────────────────────────────────────────────────────

export async function getProviderLogs(limit = 50): Promise<InvoiceLogEntry[]> {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()

  const { data, error } = await dianDb(supabase)
    .from('dian_invoice_logs')
    .select('id, sale_id, operation, status, error_message, provider_invoice_id, cude, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []) as InvoiceLogEntry[]
}

// ─────────────────────────────────────────────────────────────
// Provider testing
// ─────────────────────────────────────────────────────────────

export async function testProviderConnection(
  slug: ProviderSlug,
  credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  try {
    const provider = createProvider(slug)
    provider.configure(credentials)

    const testResult = await provider.sendInvoice({
      saleId: 'test-000',
      customer: {
        name: 'Test Customer',
        idType: 'CC',
        idNumber: '123456',
      },
      items: [
        {
          description: 'Test Item',
          quantity: 1,
          unitPrice: 1000,
          taxRate: 19,
        },
      ],
      subtotal: 1000,
      tax: 190,
      total: 1190,
    })

    return {
      success: testResult.success,
      message: testResult.errorMessage ?? 'Connection successful',
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

import { z } from 'zod'

// ─────────────────────────────────────────────────────────────
// Provider types
// ─────────────────────────────────────────────────────────────
export const providerSlugSchema = z.enum(['alegra', 'siigo'])
export type ProviderSlug = z.infer<typeof providerSlugSchema>

export const environmentSchema = z.enum(['test', 'production'])
export type Environment = z.infer<typeof environmentSchema>

// ─────────────────────────────────────────────────────────────
// DIAN document types
// ─────────────────────────────────────────────────────────────
export const documentTypeSchema = z.enum([
  'CC',
  'NIT',
  'CE',
  'PP',
  'NUIP',
])
export type DocumentType = z.infer<typeof documentTypeSchema>

export const invoiceTypeSchema = z.enum([
  'factura_venta',
  'factura_exportacion',
  'nota_credito',
  'nota_debito',
  'comprobante_contable',
])
export type InvoiceType = z.infer<typeof invoiceTypeSchema>

// ─────────────────────────────────────────────────────────────
// Invoice creation input
// ─────────────────────────────────────────────────────────────
export interface DianCustomer {
  name: string
  idType: DocumentType
  idNumber: string
  email?: string
}

export interface DianInvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export interface DianInvoiceInput {
  saleId: string
  customer: DianCustomer
  items: DianInvoiceItem[]
  subtotal: number
  tax: number
  total: number
}

// ─────────────────────────────────────────────────────────────
// Provider response
// ─────────────────────────────────────────────────────────────
export interface DianInvoiceResult {
  success: boolean
  invoiceNumber?: string
  cude?: string
  providerInvoiceId?: string
  errorMessage?: string
  rawResponse?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────
// Provider interface
// ─────────────────────────────────────────────────────────────
export abstract class DianProvider {
  abstract readonly slug: ProviderSlug
  abstract readonly name: string

  abstract configure(credentials: Record<string, string>): void
  abstract sendInvoice(input: DianInvoiceInput): Promise<DianInvoiceResult>
  abstract cancelInvoice(providerInvoiceId: string): Promise<{ success: boolean; errorMessage?: string }>
}

// ─────────────────────────────────────────────────────────────
// Config form schema
// ─────────────────────────────────────────────────────────────
export const alegraConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  domain: z.string().default('https://api.alegra.com'),
})
export type AlegraConfig = z.infer<typeof alegraConfigSchema>

export const siigoConfigSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  subscription: z.string().min(1, 'Subscription is required'),
})
export type SiigoConfig = z.infer<typeof siigoConfigSchema>

// ─────────────────────────────────────────────────────────────
// Provider credentials (encrypted storage)
// ─────────────────────────────────────────────────────────────
export interface AlegraCredentials {
  apiKey: string
  domain: string
}

export interface SiigoCredentials {
  username: string
  password: string
  subscription: string
}

export type ProviderCredentials = AlegraCredentials | SiigoCredentials

// ─────────────────────────────────────────────────────────────
// Invoice log entry (from invoice_logs table)
// ─────────────────────────────────────────────────────────────
export interface InvoiceLogEntry {
  id: string
  sale_id: string
  operation: string
  status: string
  error_message: string | null
  provider_invoice_id: string | null
  cude: string | null
  created_at: string
}

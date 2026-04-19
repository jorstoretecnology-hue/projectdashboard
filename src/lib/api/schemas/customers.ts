import { z } from 'zod';

export const CustomerStatusEnum = z.enum(['active', 'inactive', 'lead']);
export const IdentificationTypeEnum = z.enum([
  'CC',
  'NIT',
  'CE',
  'PASAPORTE',
  'TI',
  'RUT',
  'OTHER',
]);

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido').toLowerCase(),
  phone: z.string().regex(phoneRegex, 'Teléfono inválido').optional().or(z.literal('')),
  document: z.string().optional().or(z.literal('')),
  identificationType: IdentificationTypeEnum.optional().default('CC'),
  address: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
  status: CustomerStatusEnum.default('active'),
  notes: z.string().optional().or(z.literal('')),
  metadata: z.record(z.string(), z.unknown()).default({}),

  // LEY 1581 (Solo UI)
  data_consent_accepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar la política de datos (Ley 1581)',
    })
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ data_consent_accepted: true })
  .partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  city: z.string().optional(),
  status: CustomerStatusEnum.optional(),
  sortBy: z.enum(['created_at', 'name', 'companyName']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryDTO = z.infer<typeof customerQuerySchema>;
export type CustomerFormValues = CreateCustomerDTO;

/**
 * Interface Customer alineada con database.types.ts
 */
export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
  created_at: string;
  updated_at: string | null;
  company_name?: string | null;
  tax_id?: string | null;
  identification_type?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  data_consent_at: string | null;
  data_consent_ip: string | null;
  data_consent_version: string | null;
}

// Helper para guardar en DB
export function toDbCustomer(
  data: CreateCustomerDTO & {
    tenant_id: string;
    data_consent_at?: string;
    data_consent_ip?: string;
    data_consent_version?: string;
  },
) {

  return {
    tenant_id: data.tenant_id,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    document: data.document || null,
    address: data.address || null,
    company_name: data.companyName || null,
    tax_id: data.taxId || null,
    identification_type: data.identificationType || null,
    notes: data.notes || null,
    metadata: data.metadata,
    data_consent_at: data.data_consent_at || null,
    data_consent_ip: data.data_consent_ip || null,
    data_consent_version: data.data_consent_version || null,
  };
}

// Helper para leer de DB - evitamos el uso de any
export function fromDbCustomer(db: Record<string, unknown>): Customer {
  return {
    id: String(db.id),
    tenant_id: String(db.tenant_id),
    name: String(db.name),
    email: db.email ? String(db.email) : null,
    phone: db.phone ? String(db.phone) : null,
    document: db.document ? String(db.document) : null,
    address: db.address ? String(db.address) : null,
    created_at: String(db.created_at),
    updated_at: db.updated_at ? String(db.updated_at) : null,
    company_name: db.company_name ? String(db.company_name) : null,
    tax_id: db.tax_id ? String(db.tax_id) : null,
    identification_type: db.identification_type ? String(db.identification_type) : null,
    notes: db.notes ? String(db.notes) : null,
    metadata: (db.metadata as Record<string, unknown>) || {},
    data_consent_at: db.data_consent_at ? String(db.data_consent_at) : null,
    data_consent_ip: db.data_consent_ip ? String(db.data_consent_ip) : null,
    data_consent_version: db.data_consent_version ? String(db.data_consent_version) : null,
  };
}

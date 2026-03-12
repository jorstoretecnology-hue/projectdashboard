import { z } from 'zod';

// Enums
export const CustomerStatusEnum = z.enum(['active', 'inactive', 'lead']);
export const IdentificationTypeEnum = z.enum([
  'CC', // Cédula de Ciudadanía
  'NIT', // Número de Identificación Tributaria
  'CE', // Cédula de Extranjería
  'PASAPORTE',
  'TI', // Tarjeta de Identidad
  'RUT', // Registro Único Tributario (Generic)
  'OTHER',
]);

// Helper para validar teléfonos (básico, puede mejorarse con libphonenumber si es necesario)
const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;

export const createCustomerSchema = z.object({
  // Campos básicos
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').toLowerCase(),
  phone: z.string().regex(phoneRegex, 'Número de teléfono inválido').optional().or(z.literal('')),
  
  // Campos Enterprise / B2B
  company_name: z.string().optional(),
  tax_id: z.string().optional(), // NIT/RUC
  identification_type: IdentificationTypeEnum.optional().default('CC'),
  identification_number: z.string().optional(), // DNI personal si no es empresa
  
  // Dirección y Ubicación
  address: z.string().optional(),
  city: z.string().optional(),
  location_id: z.string().uuid().optional(),
  
  // Estado y Notas
  status: CustomerStatusEnum.default('active'),
  notes: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  
  // Metadata flexible
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  // Permitir desactivar explícitamente si se requiere lógica extra en update
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(), // Busca en name, email, company, tax_id
  status: CustomerStatusEnum.optional(),
  city: z.string().optional(),
  sort_by: z.enum(['created_at', 'last_name', 'company_name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryDTO = z.infer<typeof customerQuerySchema>;

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

/**
 * Schema principal para crear clientes
 * Unificado desde modules/customers/types.ts (camelCase) y API schema (snake_case)
 */
export const createCustomerSchema = z.object({
  // Campos básicos (camelCase para consistencia con frontend)
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').toLowerCase(),
  phone: z.string().regex(phoneRegex, 'Número de teléfono inválido').optional().or(z.literal('')),

  // Campos Enterprise / B2B
  companyName: z.string().optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
  identificationType: IdentificationTypeEnum.optional().default('CC'),
  identificationNumber: z.string().optional().or(z.literal('')),

  // Dirección y Ubicación
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  locationId: z.string().uuid().optional(),

  // Estado y Notas
  status: CustomerStatusEnum.default('active'),
  notes: z.string().optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),

  // Metadata flexible
  metadata: z.record(z.string(), z.unknown()).default({}),
});

/**
 * Schema para actualizar clientes (todos los campos opcionales)
 */
export const updateCustomerSchema = createCustomerSchema.partial();

/**
 * Schema para queries de clientes (paginación, filtros, ordenamiento)
 */
export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(), // Busca en firstName, email, companyName, taxId
  status: CustomerStatusEnum.optional(),
  city: z.string().optional(),
  sortBy: z.enum(['created_at', 'lastName', 'companyName']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Tipos inferidos desde los schemas
 */
export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryDTO = z.infer<typeof customerQuerySchema>;

/**
 * Tipo Customer completo (con ID y fechas)
 */
export interface Customer extends CreateCustomerDTO {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Alias para compatibilidad con forms (CustomerFormValues)
 */
export type CustomerFormValues = CreateCustomerDTO;

/**
 * Helper: Convertir de camelCase (frontend) a snake_case (database)
 */
export function toDbCustomer(data: CreateCustomerDTO): {
  first_name: string;
  last_name: string;
  company_name?: string;
  tax_id?: string;
  identification_type?: string;
  identification_number?: string;
  location_id?: string;
} & Omit<CreateCustomerDTO, 'firstName' | 'lastName' | 'companyName' | 'taxId' | 'identificationType' | 'identificationNumber' | 'locationId'> {
  const {
    firstName,
    lastName,
    companyName,
    taxId,
    identificationType,
    identificationNumber,
    locationId,
    ...rest
  } = data;

  return {
    ...rest,
    first_name: firstName,
    last_name: lastName,
    company_name: companyName,
    tax_id: taxId,
    identification_type: identificationType,
    identification_number: identificationNumber,
    location_id: locationId,
  };
}

/**
 * Helper: Convertir de snake_case (database) a camelCase (frontend)
 */
export function fromDbCustomer(dbData: {
  first_name: string;
  last_name: string;
  company_name?: string;
  tax_id?: string;
  identification_type?: string;
  identification_number?: string;
  location_id?: string;
  [key: string]: unknown;
}): Customer {
  const {
    first_name,
    last_name,
    company_name,
    tax_id,
    identification_type,
    identification_number,
    location_id,
    ...rest
  } = dbData;

  return {
    ...rest,
    firstName: first_name,
    lastName: last_name,
    companyName: company_name,
    taxId: tax_id,
    identificationType: identification_type,
    identificationNumber: identification_number,
    locationId: location_id,
  } as Customer;
}

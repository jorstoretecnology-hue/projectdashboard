import { z } from 'zod';

export const customerCreateSchema = z.object({
  name: z.string().min(2, 'Nombre requerido (mínimo 2 caracteres)'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos').optional().or(z.literal('')),
  document: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  data_consent_accepted: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar la política de tratamiento de datos para continuar'
  }),
});

export const customerUpdateSchema = customerCreateSchema
  .omit({ data_consent_accepted: true })
  .partial();
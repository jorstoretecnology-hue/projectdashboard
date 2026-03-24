import { z } from 'zod';

export type IndustryType =
  | 'taller'
  | 'restaurante'
  | 'supermercado'
  | 'ferreteria'
  | 'gym'
  | 'glamping'
  | 'discoteca';

export const BaseProductSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  price: z.number().positive('Precio debe ser positivo'),
  stock: z.union([z.number().int().nonnegative(), z.boolean()]),
  category: z.string().min(1, 'Categoría requerida'),
  sku: z.string().optional(),
  image: z.string().url().optional(),
});

export interface IndustryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: z.ZodTypeAny;
}

export interface IndustryConfig {
  slug: IndustryType;
  name: string;
  description: string;
  icon: string;
  productTypes: string[];
  fields: IndustryField[];
  customerFields?: IndustryField[];
  requiresInspection?: boolean;
  inspectionConfig?: {
    items: string[];
    suggestedPhotos: string[];
  };
  statusOptions: { value: string; label: string; color: string }[];
  defaultModules: string[];
}

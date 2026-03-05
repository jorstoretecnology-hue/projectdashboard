import { z } from 'zod';

// Enums (Matches DB constraints)
export const ServiceStateEnum = z.enum([
  'RECIBIDO',
  'EN_PROCESO',
  'BLOQUEADO',
  'REPARADO',
  'ENTREGADO'
]);

export const ServicePriorityEnum = z.enum([
  'BAJA',
  'NORMAL',
  'ALTA',
  'URGENTE'
]);

export const ServiceItemTypeEnum = z.enum([
  'PART', // Repuesto (Inventariable)
  'LABOR' // Mano de obra (Servicio)
]);

// -----------------------------------------------------
// Vehicles Schemas
// -----------------------------------------------------
export const createVehicleSchema = z.object({
  customer_id: z.string().uuid(),
  brand: z.string().min(2),
  model: z.string().min(2),
  year: z.number().int().min(1900).max(2100).optional(),
  plate: z.string().min(1).toUpperCase(), // Normalizar a mayúsculas
  vin: z.string().optional(),
  color: z.string().optional(),
  mileage: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().omit({ customer_id: true }); // No cambiar dueño fácilmente

export const vehicleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(), // Placa, Modelo
  customer_id: z.string().uuid().optional(),
});

// -----------------------------------------------------
// Service Orders Schemas
// -----------------------------------------------------

// Header
export const createServiceOrderSchema = z.object({
  customer_id: z.string().uuid(), // Redundante si viene vehículo? No, validamos que coincida.
  vehicle_id: z.string().uuid(),
  priority: ServicePriorityEnum.default('NORMAL'),
  description: z.string().min(5, 'Descripción requerida'),
  mileage: z.number().int().nonnegative().optional(), // Kilometraje de entrada
  technician_id: z.string().uuid().optional(),
});

export const updateServiceOrderSchema = z.object({
  state: ServiceStateEnum.optional(),
  priority: ServicePriorityEnum.optional(),
  diagnosis: z.string().optional(),
  technician_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// Items
export const createServiceItemSchema = z.object({
  product_id: z.string().uuid().optional(), // Opcional para Items libres (Mano de obra manual)? Recomendado usar productos.
  description: z.string().min(2),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  item_type: ServiceItemTypeEnum,
});

// Query
export const serviceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  state: ServiceStateEnum.optional(),
  customer_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  technician_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'priority']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type CreateVehicleDTO = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDTO = z.infer<typeof updateVehicleSchema>;
export type VehicleQueryDTO = z.infer<typeof vehicleQuerySchema>;

export type CreateServiceOrderDTO = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderDTO = z.infer<typeof updateServiceOrderSchema>;
export type CreateServiceItemDTO = z.infer<typeof createServiceItemSchema>;
export type ServiceQueryDTO = z.infer<typeof serviceQuerySchema>;

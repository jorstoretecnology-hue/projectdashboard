import { z } from 'zod';
import { IndustryConfig } from './types';

export const glampingConfig: IndustryConfig = {
  slug: 'glamping',
  name: 'Glamping / Hotelería',
  description: 'Alojamiento de lujo en la naturaleza',
  icon: '🏕️',
  productTypes: ['habitacion', 'paquete', 'servicio_adicional', 'experiencia'],
  defaultModules: ['dashboard', 'customers', 'billing', 'settings'],
  fields: [
    {
      key: 'tipo_alojamiento',
      label: 'Tipo de Alojamiento',
      type: 'select',
      required: true,
      options: [
        { value: 'tienda_lujo', label: 'Tienda de Lujo' },
        { value: 'cabaña', label: 'Cabaña' },
        { value: 'domo', label: 'Domo Geodésico' },
        { value: 'carcarpa_safari', label: 'Carpa Safari' },
        { value: 'yurta', label: 'Yurta' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'capacidad',
      label: 'Capacidad Máxima',
      type: 'number',
      required: true,
      placeholder: 'Ej: 2',
      validation: z.number().int().positive()
    },
    {
      key: 'vistas',
      label: 'Tipo de Vistas',
      type: 'select',
      required: false,
      options: [
        { value: 'montana', label: 'Montaña' },
        { value: 'lago', label: 'Lago' },
        { value: 'bosque', label: 'Bosque' },
        { value: 'valle', label: 'Valle' },
        { value: 'oceano', label: 'Océano' }
      ],
      validation: z.string().optional()
    },
    {
      key: 'servicios_incluidos',
      label: 'Servicios Incluidos',
      type: 'textarea',
      required: false,
      placeholder: 'Lista de servicios incluidos (wifi, desayuno, etc.)',
      validation: z.string().optional()
    },
    {
      key: 'temporada_alta',
      label: 'Precio Temporada Alta',
      type: 'number',
      required: false,
      placeholder: 'Precio adicional en temporada alta',
      validation: z.number().positive().optional()
    }
  ],
  customerFields: [
    {
      key: 'tipo_documento',
      label: 'Tipo de Documento',
      type: 'select',
      required: true,
      options: [
        { value: 'cc', label: 'Cédula de Ciudadanía' },
        { value: 'pasaporte', label: 'Pasaporte' },
        { value: 'ce', label: 'Cédula de Extranjería' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'numero_documento',
      label: 'Número de Documento',
      type: 'text',
      required: true,
      placeholder: 'Ej: 123456789',
      validation: z.string().min(1)
    },
    {
      key: 'nacionalidad',
      label: 'Nacionalidad',
      type: 'text',
      required: true,
      placeholder: 'Ej: Colombiana, Argentina...',
      validation: z.string().min(1)
    },
    {
      key: 'matricula_vehiculo',
      label: 'Placa del Vehículo (Opcional)',
      type: 'text',
      required: false,
      placeholder: 'Ej: XYZ-789',
      validation: z.string().optional()
    }
  ],
  requiresInspection: false,
  statusOptions: [
    { value: 'disponible', label: 'Disponible', color: 'green' },
    { value: 'reservada', label: 'Reservada', color: 'blue' },
    { value: 'mantenimiento', label: 'En Mantenimiento', color: 'yellow' },
    { value: 'cerrada', label: 'Cerrada por Temporada', color: 'red' }
  ]
};

import { z } from 'zod';
import { IndustryConfig } from './types';

export const tallerConfig: IndustryConfig = {
  name: 'Taller Mecánico',
  description: 'Reparación y mantenimiento de motos y carros',
  icon: '🔧',
  productTypes: ['repuesto', 'servicio', 'accesorio'],
  defaultModules: ['Dashboard', 'Inventory', 'Customers', 'Billing', 'Settings'],
  fields: [
    // ... campos de productos existentes (omitidos por brevedad si fuera necesario, pero los mantendré)
    {
      key: 'marca',
      label: 'Marca del Vehículo',
      type: 'select',
      required: true,
      options: [
        { value: 'yamaha', label: 'Yamaha' },
        { value: 'honda', label: 'Honda' },
        { value: 'kawasaki', label: 'Kawasaki' },
        { value: 'toyota', label: 'Toyota' },
        { value: 'chevrolet', label: 'Chevrolet' },
        { value: 'ford', label: 'Ford' },
        { value: 'otra', label: 'Otra' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'modelo',
      label: 'Modelo del Vehículo',
      type: 'text',
      required: true,
      placeholder: 'Ej: R1, Civic, etc.',
      validation: z.string().min(1)
    },
    {
      key: 'ano',
      label: 'Año',
      type: 'number',
      required: true,
      placeholder: 'Ej: 2020',
      validation: z.number().int().min(1900).max(2030)
    },
    {
      key: 'tipo_vehiculo',
      label: 'Tipo de Vehículo',
      type: 'select',
      required: true,
      options: [
        { value: 'moto', label: 'Motocicleta' },
        { value: 'carro', label: 'Automóvil' }
      ],
      validation: z.enum(['moto', 'carro'])
    },
    {
      key: 'tiempo_reparacion',
      label: 'Tiempo Estimado de Reparación',
      type: 'text',
      required: false,
      placeholder: 'Ej: 2 horas, 1 día',
      validation: z.string().optional()
    }
  ],
  customerFields: [
    {
      key: 'tipo_servicio',
      label: 'Especialidad',
      type: 'select',
      required: true,
      options: [
        { value: 'vehiculo', label: 'Motos / Carros' },
        { value: 'electronica', label: 'Celulares / Electrónica' },
        { value: 'otros', label: 'Otros Servicios' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'vehiculo_placa',
      label: 'Placa / Patente',
      type: 'text',
      required: false,
      placeholder: 'Ej: ABC-123',
      validation: z.string().optional()
    },
    {
      key: 'vehiculo_marca',
      label: 'Marca',
      type: 'text',
      required: false,
      placeholder: 'Ej: Toyota, Yamaha, Samsung',
      validation: z.string().optional()
    },
    {
      key: 'vehiculo_modelo',
      label: 'Modelo / Versión',
      type: 'text',
      required: false,
      placeholder: 'Ej: Hilux, iPhone 15',
      validation: z.string().optional()
    },
    {
      key: 'imei_serial',
      label: 'IMEI / Serial / VIN',
      type: 'text',
      required: false,
      placeholder: 'Identificador único del equipo',
      validation: z.string().optional()
    }
  ],
  requiresInspection: true,
  inspectionConfig: {
    items: [
      'Encendido y Motor',
      'Luces y Direccionales',
      'Nivel de Combustible / Batería',
      'Estado de Llantas / Chasis',
      'Frenos y Suspensión',
      'Rayones o Daños Estéticos',
      'Accesorios (Espejos, Maleteros, etc.)'
    ],
    suggestedPhotos: [
      'Frente',
      'Lado Izquierdo',
      'Lado Derecho',
      'Trasera / Panel de Control'
    ]
  },
  statusOptions: [
    { value: 'disponible', label: 'Disponible', color: 'green' },
    { value: 'en_reparacion', label: 'En Reparación', color: 'yellow' },
    { value: 'reparado', label: 'Reparado', color: 'blue' },
    { value: 'no_disponible', label: 'No Disponible', color: 'red' }
  ]
};

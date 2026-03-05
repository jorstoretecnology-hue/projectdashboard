import { z } from 'zod';
import { IndustryConfig } from './types';

export const discotecaConfig: IndustryConfig = {
  name: 'Discoteca',
  description: 'Eventos nocturnos, bebidas y entretenimiento',
  icon: '🕺',
  productTypes: ['entrada', 'bebida', 'evento_privado', 'reservacion'],
  defaultModules: ['Dashboard', 'Inventory', 'Customers', 'Billing', 'Settings'],
  fields: [
    {
      key: 'tipo_evento',
      label: 'Tipo de Evento',
      type: 'select',
      required: true,
      options: [
        { value: 'noche_regular', label: 'Noche Regular' },
        { value: 'fiesta_tematica', label: 'Fiesta Temática' },
        { value: 'evento_privado', label: 'Evento Privado' },
        { value: 'concierto', label: 'Concierto' },
        { value: 'after_party', label: 'After Party' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'capacidad_maxima',
      label: 'Capacidad Máxima',
      type: 'number',
      required: true,
      placeholder: 'Ej: 500',
      validation: z.number().int().positive()
    },
    {
      key: 'edad_minima',
      label: 'Edad Mínima',
      type: 'number',
      required: true,
      placeholder: 'Ej: 18',
      validation: z.number().int().min(0).max(100)
    },
    {
      key: 'hora_apertura',
      label: 'Hora de Apertura',
      type: 'text',
      required: false,
      placeholder: 'Ej: 22:00',
      validation: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    },
    {
      key: 'hora_cierre',
      label: 'Hora de Cierre',
      type: 'text',
      required: false,
      placeholder: 'Ej: 06:00',
      validation: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    },
    {
      key: 'dj_residente',
      label: 'DJ Residente',
      type: 'text',
      required: false,
      placeholder: 'Nombre del DJ o artista',
      validation: z.string().optional()
    }
  ],
  customerFields: [
    {
      key: 'tipo_membresia',
      label: 'Tipo de Membresía',
      type: 'select',
      required: false,
      options: [
        { value: 'ninguna', label: 'Regular' },
        { value: 'vip', label: 'VIP' },
        { value: 'black', label: 'Black Card' }
      ],
      validation: z.string().optional()
    },
    {
      key: 'bebida_favorita',
      label: 'Bebida Favorita / Reserva Habitual',
      type: 'text',
      required: false,
      placeholder: 'Ej: Tequila Don Julio, Gin Tonic...',
      validation: z.string().optional()
    },
    {
      key: 'preferencia_zona',
      label: 'Zona Preferida',
      type: 'select',
      required: false,
      options: [
        { value: 'general', label: 'General' },
        { value: 'vip_stage', label: 'VIP Stage' },
        { value: 'balcon', label: 'Balcón' }
      ],
      validation: z.string().optional()
    }
  ],
  requiresInspection: false,
  statusOptions: [
    { value: 'abierto', label: 'Abierto', color: 'green' },
    { value: 'cerrado', label: 'Cerrado', color: 'red' },
    { value: 'evento_especial', label: 'Evento Especial', color: 'purple' },
    { value: 'mantenimiento', label: 'En Mantenimiento', color: 'yellow' }
  ]
};

import { z } from 'zod';
import { IndustryConfig } from './types';

export const restauranteConfig: IndustryConfig = {
  name: 'Restaurante',
  description: 'Gestión de platos, menús y servicios gastronómicos',
  icon: '🍽️',
  productTypes: ['plato', 'bebida', 'menu', 'postre'],
  defaultModules: ['Dashboard', 'Inventory', 'Customers', 'Billing', 'Settings'],
  fields: [
    {
      key: 'tipo_cocina',
      label: 'Tipo de Cocina',
      type: 'select',
      required: true,
      options: [
        { value: 'italiana', label: 'Italiana' },
        { value: 'mexicana', label: 'Mexicana' },
        { value: 'japonesa', label: 'Japonesa' },
        { value: 'colombiana', label: 'Colombiana' },
        { value: 'vegetariana', label: 'Vegetariana' },
        { value: 'otra', label: 'Otra' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'tiempo_preparacion',
      label: 'Tiempo Prep. (min)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 20',
      validation: z.number().int().positive()
    },
    {
      key: 'dificultad',
      label: 'Nivel de Dificultad',
      type: 'select',
      required: false,
      options: [
        { value: 'bajo', label: 'Bajo' },
        { value: 'medio', label: 'Medio' },
        { value: 'alto', label: 'Alto' }
      ],
      validation: z.enum(['bajo', 'medio', 'alto']).optional()
    },
    {
      key: 'alergenos',
      label: 'Alérgenos',
      type: 'text',
      required: false,
      placeholder: 'Ej: Gluten, Maní...',
      validation: z.string().optional()
    },
    {
      key: 'calorias',
      label: 'Calorías (kcal)',
      type: 'number',
      required: false,
      placeholder: 'Ej: 450',
      validation: z.number().positive().optional()
    }
  ],
  customerFields: [
    {
      key: 'preferencias_dieteticas',
      label: 'Preferencias Dietéticas',
      type: 'select',
      required: false,
      options: [
        { value: 'ninguna', label: 'Ninguna' },
        { value: 'vegetariano', label: 'Vegetariano' },
        { value: 'vegano', label: 'Vegano' },
        { value: 'keto', label: 'Keto' },
        { value: 'gluten_free', label: 'Sin Gluten' }
      ],
      validation: z.string().optional()
    },
    {
      key: 'alergenos_cliente',
      label: 'Alérgenos Médicos',
      type: 'textarea',
      required: false,
      placeholder: 'Ej: Alérgico a los mariscos, nueces...',
      validation: z.string().optional()
    },
    {
      key: 'fecha_aniversario',
      label: 'Fecha Especial (Cumpleaños/Aniversario)',
      type: 'text',
      required: false,
      placeholder: 'DD/MM',
      validation: z.string().optional()
    }
  ],
  requiresInspection: false,
  statusOptions: [
    { value: 'disponible', label: 'Disponible', color: 'green' },
    { value: 'agotado', label: 'Agotado', color: 'red' },
    { value: 'temporalmente_no', label: 'Temporalmente No Disponible', color: 'yellow' }
  ]
};

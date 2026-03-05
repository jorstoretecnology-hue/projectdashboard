import { z } from 'zod';
import { IndustryConfig } from './types';

export const gymConfig: IndustryConfig = {
  name: 'Gimnasio',
  description: 'Membresías, clases y servicios fitness',
  icon: '💪',
  productTypes: ['membresia', 'clase', 'suplemento', 'equipamiento'],
  defaultModules: ['Dashboard', 'Customers', 'Billing', 'Settings'],
  fields: [
    {
      key: 'tipo_servicio_gym',
      label: 'Tipo de Servicio',
      type: 'select',
      required: true,
      options: [
        { value: 'membresia_basica', label: 'Membresía Básica' },
        { value: 'membresia_premium', label: 'Membresía Premium' },
        { value: 'clase_grupal', label: 'Clase Grupal' },
        { value: 'entrenamiento_personal', label: 'Entrenamiento Personal' },
        { value: 'suplemento', label: 'Suplemento Alimenticio' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'duracion',
      label: 'Duración',
      type: 'select',
      required: false,
      options: [
        { value: 'mensual', label: 'Mensual' },
        { value: 'trimestral', label: 'Trimestral' },
        { value: 'semestral', label: 'Semestral' },
        { value: 'anual', label: 'Anual' },
        { value: 'unico', label: 'Pago Único' }
      ],
      validation: z.string().optional()
    },
    {
      key: 'sesiones_incluidas',
      label: 'Sesiones Incluidas',
      type: 'number',
      required: false,
      placeholder: 'Ej: 12 (por mes)',
      validation: z.number().int().positive().optional()
    },
    {
      key: 'entrenador_asignado',
      label: 'Entrenador Asignado',
      type: 'text',
      required: false,
      placeholder: 'Nombre del entrenador',
      validation: z.string().optional()
    },
    {
      key: 'nivel_dificultad',
      label: 'Nivel de Dificultad',
      type: 'select',
      required: false,
      options: [
        { value: 'principiante', label: 'Principiante' },
        { value: 'intermedio', label: 'Intermedio' },
        { value: 'avanzado', label: 'Avanzado' }
      ],
      validation: z.enum(['principiante', 'intermedio', 'avanzado']).optional()
    }
  ],
  customerFields: [
    {
      key: 'objetivo',
      label: 'Objetivo Principal',
      type: 'select',
      required: true,
      options: [
        { value: 'perder_peso', label: 'Pérdida de Peso' },
        { value: 'ganar_musculo', label: 'Ganancia Muscular' },
        { value: 'salud', label: 'Salud / Bienestar' },
        { value: 'rendimiento', label: 'Rendimiento Deportivo' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'restricciones_medicas',
      label: 'Restricciones Médicas / Lesiones',
      type: 'textarea',
      required: false,
      placeholder: 'Ej: Lesión en rodilla izquierda, asma...',
      validation: z.string().optional()
    },
    {
      key: 'fecha_nacimiento',
      label: 'Fecha de Nacimiento',
      type: 'text',
      required: false,
      placeholder: 'DD/MM/AAAA',
      validation: z.string().optional()
    }
  ],
  requiresInspection: false,
  statusOptions: [
    { value: 'activa', label: 'Activa', color: 'green' },
    { value: 'suspendida', label: 'Suspendida', color: 'yellow' },
    { value: 'vencida', label: 'Vencida', color: 'red' },
    { value: 'cancelada', label: 'Cancelada', color: 'gray' }
  ]
};

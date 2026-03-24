import { z } from 'zod';
import { IndustryConfig } from './types';

export const ferreteriaConfig: IndustryConfig = {
  slug: 'ferreteria',
  name: 'Ferretería / Construcción',
  description: 'Herramientas, materiales de construcción y ferretería',
  icon: '🔨',
  productTypes: ['herramienta', 'material', 'electricidad', 'plomeria', 'pintura'],
  defaultModules: ['dashboard', 'inventory', 'customers', 'billing', 'settings'],
  fields: [
    {
      key: 'tipo_ferreteria',
      label: 'Tipo de Producto',
      type: 'select',
      required: true,
      options: [
        { value: 'herramienta_manual', label: 'Herramienta Manual' },
        { value: 'herramienta_electrica', label: 'Herramienta Eléctrica' },
        { value: 'material_construccion', label: 'Material de Construcción' },
        { value: 'electricidad', label: 'Electricidad' },
        { value: 'plomeria', label: 'Plomería' },
        { value: 'pintura', label: 'Pintura y Acabados' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'marca',
      label: 'Marca',
      type: 'text',
      required: true,
      placeholder: 'Ej: Bellota, Stanley, etc.',
      validation: z.string().min(1)
    },
    {
      key: 'modelo',
      label: 'Modelo/Referencia',
      type: 'text',
      required: false,
      placeholder: 'Ej: ST123',
      validation: z.string().optional()
    },
    {
      key: 'unidad_medida',
      label: 'Unidad de Medida',
      type: 'select',
      required: true,
      options: [
        { value: 'unidad', label: 'Unidad' },
        { value: 'metro', label: 'Metro' },
        { value: 'kilo', label: 'Kilogramo' },
        { value: 'litro', label: 'Litro' },
        { value: 'paquete', label: 'Paquete' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'material',
      label: 'Material Principal',
      type: 'text',
      required: false,
      placeholder: 'Ej: Acero, PVC, Cobre',
      validation: z.string().optional()
    },
    {
      key: 'dimensiones',
      label: 'Dimensiones',
      type: 'text',
      required: false,
      placeholder: 'Ej: 10x15cm, 2m de largo',
      validation: z.string().optional()
    },
    {
      key: 'voltaje',
      label: 'Voltaje (si aplica)',
      type: 'select',
      required: false,
      options: [
        { value: '110v', label: '110V' },
        { value: '220v', label: '220V' },
        { value: 'bateria', label: 'Batería' }
      ],
      validation: z.enum(['110v', '220v', 'bateria']).optional()
    },
    {
      key: 'garantia',
      label: 'Garantía (meses)',
      type: 'number',
      required: false,
      placeholder: 'Ej: 12',
      validation: z.number().int().positive().optional()
    }
  ],
  customerFields: [
    {
      key: 'tipo_cliente',
      label: 'Tipo de Cliente',
      type: 'select',
      required: true,
      options: [
        { value: 'final', label: 'Consumidor Final' },
        { value: 'mayorista', label: 'Mayorista / Distribuidor' },
        { value: 'contratista', label: 'Contratista / Profesional' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'descuento_frecuente',
      label: '% Descuento Fijo',
      type: 'number',
      required: false,
      placeholder: 'Ej: 10',
      validation: z.number().min(0).max(100).optional()
    },
    {
      key: 'limite_credito',
      label: 'Límite de Crédito ($)',
      type: 'number',
      required: false,
      placeholder: 'Ej: 5000',
      validation: z.number().min(0).optional()
    }
  ],
  statusOptions: [
    { value: 'disponible', label: 'Disponible', color: 'green' },
    { value: 'pedido_pendiente', label: 'Pedido Pendiente', color: 'yellow' },
    { value: 'agotado', label: 'Agotado', color: 'red' },
    { value: 'descontinuado', label: 'Descontinuado', color: 'gray' }
  ]
};

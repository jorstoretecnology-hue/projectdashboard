import { z } from 'zod';
import { IndustryConfig } from './types';

export const supermercadoConfig: IndustryConfig = {
  slug: 'supermercado',
  name: 'Supermercado / Retail',
  description: 'Gestión de productos de consumo masivo',
  icon: '🛒',
  productTypes: ['alimento', 'bebida', 'limpieza', 'higiene', 'electronico'],
  defaultModules: ['dashboard', 'inventory', 'customers', 'billing', 'settings'],
  fields: [
    {
      key: 'categoria_supermercado',
      label: 'Categoría de Producto',
      type: 'select',
      required: true,
      options: [
        { value: 'frescos', label: 'Productos Frescos' },
        { value: 'congelados', label: 'Congelados' },
        { value: 'enlatados', label: 'Enlatados' },
        { value: 'bebidas', label: 'Bebidas' },
        { value: 'limpieza', label: 'Limpieza' },
        { value: 'higiene', label: 'Higiene Personal' },
        { value: 'electronica', label: 'Electrónica' }
      ],
      validation: z.string().min(1)
    },
    {
      key: 'fecha_vencimiento',
      label: 'Fecha de Vencimiento',
      type: 'text',
      required: false,
      placeholder: 'YYYY-MM-DD',
      validation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    },
    {
      key: 'peso_neto',
      label: 'Peso Neto',
      type: 'text',
      required: false,
      placeholder: 'Ej: 500g, 1.5kg',
      validation: z.string().optional()
    },
    {
      key: 'marca',
      label: 'Marca',
      type: 'text',
      required: false,
      placeholder: 'Ej: Coca-Cola, Nestlé',
      validation: z.string().optional()
    },
    {
      key: 'codigo_barras',
      label: 'Código de Barras',
      type: 'text',
      required: false,
      placeholder: 'UPC o EAN',
      validation: z.string().optional()
    }
  ],
  customerFields: [
    {
      key: 'puntos_fidelidad',
      label: 'Puntos Acumulados',
      type: 'number',
      required: false,
      placeholder: '0',
      validation: z.number().min(0).optional()
    },
    {
      key: 'direccion_entrega',
      label: 'Dirección de Domicilio',
      type: 'textarea',
      required: false,
      placeholder: 'Ej: Calle 123 #45-67, Apto 401',
      validation: z.string().optional()
    },
    {
      key: 'preferencias_compras',
      label: 'Notas de Entrega',
      type: 'text',
      required: false,
      placeholder: 'Ej: Dejar en portería, no tocar timbre...',
      validation: z.string().optional()
    }
  ],
  requiresInspection: false,
  statusOptions: [
    { value: 'disponible', label: 'Disponible', color: 'green' },
    { value: 'bajo_stock', label: 'Bajo Stock', color: 'yellow' },
    { value: 'agotado', label: 'Agotado', color: 'red' },
    { value: 'descontinuado', label: 'Descontinuado', color: 'gray' }
  ]
};

/**
 * Configuración del Módulo de Inventario / Recursos
 * 
 * Basado en un Motor Propio (Opción B) diseñado para ser adaptable
 * a múltiples verticales (Retail, Restaurantes, Gyms, Hoteles).
 */

export type InventoryItemType = 'product' | 'service' | 'room' | 'membership';
export type ProductKind = 'simple' | 'variable';

export interface Attribute {
  name: string;
  values: string[];
}

export interface Variation {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // { "Talla": "L", "Color": "Rojo" }
}

export interface SEOConfig {
  slug: string;
  metaDescription: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  user: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: InventoryItemType;
  productKind: ProductKind; // Simple o Variable
  category: string;
  price: number; // Para Simple: precio fijo. Para Variable: precio base o min.
  maxPrice?: number; // Para Variable: precio max
  stock: number | boolean; // Para Simple: numero. Para Variable: suma de stock.
  minStock?: number;
  sku?: string;
  image?: string;
  attributes?: Attribute[];
  variations?: Variation[];
  seo?: SEOConfig;
  movements?: StockMovement[];
  metadata?: Record<string, any>;
}

/**
 * Mock data adaptado a diferentes verticales según el cliente
 */
export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Periféricos', slug: 'perifericos' },
  { id: 'cat-2', name: 'Gaming', slug: 'gaming', parentId: 'cat-1' },
  { id: 'cat-3', name: 'Membresías', slug: 'membresias' },
  { id: 'cat-4', name: 'Premium', slug: 'premium' },
  { id: 'cat-5', name: 'Gastronomía', slug: 'gastronomia' },
  { id: 'cat-6', name: 'Moda', slug: 'moda' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  // Vertical: Retail / Producto Simple
  {
    id: 'prod-1',
    name: 'Teclado Mecánico RGB',
    description: 'Teclado premium con switches cherry blue y retroiluminación. Ideal para oficina o gaming.',
    type: 'product',
    productKind: 'simple',
    category: 'Periféricos',
    price: 89.99,
    stock: 5,
    minStock: 10,
    sku: 'KB-89R-22',
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80',
    seo: { slug: 'teclado-mecanico-rgb', metaDescription: 'Compra el mejor teclado mecánico RGB con switches cherry blue.' },
    movements: [
      { id: 'm-1', date: '2026-01-10', user: 'Admin', type: 'in', quantity: 15, previousStock: 0, newStock: 15, note: 'Stock inicial' },
      { id: 'm-2', date: '2026-01-12', user: 'Ventas', type: 'out', quantity: 10, previousStock: 15, newStock: 5, note: 'Venta #882' }
    ],
    metadata: { color: 'Negro', conexion: 'USB-C' }
  },
  // Vertical: Retail / Producto Variable (WooCommerce Style)
  {
    id: 'prod-var-1',
    name: 'Camiseta Premium Algodón',
    description: 'Camiseta de algodón 100% orgánico disponible en varios colores y tallas.',
    type: 'product',
    productKind: 'variable',
    category: 'Moda',
    price: 25.00,
    maxPrice: 35.00,
    stock: 45, // Suma de variaciones
    minStock: 10,
    sku: 'TSHIRT-VAR',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    seo: { slug: 'camiseta-premium-algodon', metaDescription: 'Camisetas de alta calidad en múltiples tallas y colores.' },
    attributes: [
      { name: 'Talla', values: ['S', 'M', 'L'] },
      { name: 'Color', values: ['Blanco', 'Azul'] }
    ],
    variations: [
      { id: 'v1', sku: 'TS-S-W', price: 25, stock: 10, attributes: { 'Talla': 'S', 'Color': 'Blanco' } },
      { id: 'v2', sku: 'TS-M-W', price: 25, stock: 15, attributes: { 'Talla': 'M', 'Color': 'Blanco' } },
      { id: 'v3', sku: 'TS-L-B', price: 35, stock: 20, attributes: { 'Talla': 'L', 'Color': 'Azul' } }
    ],
    movements: []
  },
  // Vertical: Gimnasio / Membresía
  {
    id: 'mem-1',
    name: 'Plan Elite Mensual',
    description: 'Acceso total 24/7, clases dirigidas y zona de spa incluida.',
    type: 'membership',
    productKind: 'simple',
    category: 'Membresías',
    price: 45.00,
    stock: true,
    sku: 'GYM-ELITE',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    seo: { slug: 'plan-elite-mensual', metaDescription: 'Gimnasio 24/7 con todo incluido.' },
    movements: [],
    metadata: { sesiones_personales: 2, invitados: 1 }
  },
  // Vertical: Hotel / Habitación
  {
    id: 'room-1',
    name: 'Suite Presidencial',
    description: 'Vista panorámica al mar, cama king size y servicio a la habitación incluido.',
    type: 'room',
    productKind: 'simple',
    category: 'Premium',
    price: 250.00,
    stock: false,
    sku: 'ROOM-101',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    seo: { slug: 'suite-presidencial-vista-mar', metaDescription: 'Lujo total en nuestra mejor suite.' },
    movements: [],
    metadata: { piso: 10, cama: 'King', wifi: 'Filtro Óptico' }
  }
];

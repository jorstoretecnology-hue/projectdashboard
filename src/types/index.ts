import type { LucideIcon } from 'lucide-react'
import type { z } from 'zod'

/**
 * Configuración de un módulo del sistema
 */
export interface ModuleConfig {
  /** Identificador único del módulo */
  id: string;
  /** Nombre visible del módulo */
  name: string;
  /** Icono del módulo (componente Lucide) */
  icon: LucideIcon;
  /** Ruta de navegación */
  path: string;
  /** Descripción opcional del módulo */
  description?: string;
  /** Permisos requeridos para acceder al módulo */
  permissions?: string[];
  /** Badge opcional (ej: "Nuevo", "Beta") */
  badge?: string;
}

/**
 * Estado de activación de módulos
 * Record<moduleId, isActive>
 */
export type ModuleState = Record<string, boolean>;

/**
 * Usuario del sistema
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  avatar?: string;
}

/**
 * Roles de aplicación (Database Enum)
 */
export type AppRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER';


/**
 * Tema del sistema
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Tipos de industria soportados por el motor de configuración
 */
export type IndustryType =
  | 'taller'      // Taller Mecánico (Motos/Carros)
  | 'restaurante' // Restaurante
  | 'supermercado' // Supermercado
  | 'ferreteria'   // Ferretería
  | 'gym'         // Gimnasio
  | 'glamping'    // Glamping
  | 'discoteca';   // Discoteca

/**
 * Configuración de campos específicos por industria
 */
export interface IndustryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: z.ZodSchema; // Zod schema
}

/**
 * Configuración completa de una industria
 */
export interface IndustryConfig {
  name: string;
  description: string;
  icon: string;
  productTypes: string[];
  fields: IndustryField[];
  statusOptions: { value: string; label: string; color: string }[];
}

/**
 * Producto con configuración por industria
 */
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  stock: number | null; // null for unlimited stock
  category: string;
  sku?: string;
  image?: string;
  industryType: IndustryType;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Estado de stock del producto
 */
export type ProductStockStatus =
  | 'disponible'
  | 'bajo_stock'
  | 'agotado'
  | 'reservado'
  | 'descontinuado';

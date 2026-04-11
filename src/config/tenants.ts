/**
 * Configuración de Tenants (Multi-tenant)
 * 
 * Define la estructura de cada cliente/arrendatario del sistema SaaS.
 * Cada tenant tiene acceso solo a los módulos que ha contratado.
 */

export interface TenantBranding {
  primaryColor: string;
  logo?: string;
  favicon?: string;
}

export type PlanType = 'free' | 'starter' | 'professional' | 'enterprise';

import { FeatureFlag } from './permissions';

export interface TenantConfig {
  id: string;
  name: string;
  plan: PlanType;
  activeModules: string[]; // slugs de módulos — deben existir en MODULE_DEFINITIONS (@/core/modules/module-registry)
  active_modules?: string[]; // Alias para compatibilidad con DB
  featureFlags: FeatureFlag[]; // Nuevas features granulares
  feature_flags?: FeatureFlag[]; // Alias para compatibilidad con DB
  branding: TenantBranding;
  industryType: import('@/types').IndustryType; // Tipo de industria del tenant
  createdAt: string;
  isActive: boolean;
  maxUsers?: number;
  customDomain?: string;
}

/**
 * Mock data de tenants para demostración
 */
export const TENANTS_CONFIG: TenantConfig[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'ACME Corporation',
    plan: 'enterprise',
    activeModules: ['Dashboard', 'Users', 'Inventory', 'Customers', 'Billing', 'Settings'],
    featureFlags: ['crm', 'inventory', 'billing'],
    branding: {
      primaryColor: '221 83% 53%', // Azul (default)
      logo: '/logos/acme.png',
    },
    industryType: 'taller', // Taller Mecánico
    createdAt: '2024-01-15',
    isActive: true,
    maxUsers: 100,
    customDomain: 'acme.dashboard.com',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'TechStart Inc',
    plan: 'professional',
    activeModules: ['Dashboard', 'Users', 'Inventory', 'Customers', 'Billing'],
    featureFlags: ['crm', 'inventory', 'billing'],
    branding: {
      primaryColor: '142 76% 36%', // Verde
      logo: '/logos/techstart.png',
    },
    industryType: 'supermercado', // Supermercado
    createdAt: '2024-02-20',
    isActive: true,
    maxUsers: 50,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Retail Plus',
    plan: 'starter',
    activeModules: ['Dashboard', 'Inventory', 'Customers', 'Billing'],
    featureFlags: ['crm', 'inventory'],
    branding: {
      primaryColor: '262 83% 58%', // Púrpura
      logo: '/logos/retail.png',
    },
    industryType: 'ferreteria', // Ferretería
    createdAt: '2024-03-10',
    isActive: true,
    maxUsers: 10,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Demo Client',
    plan: 'free',
    activeModules: ['Dashboard', 'Customers', 'Billing'],
    featureFlags: ['crm'],
    branding: {
      primaryColor: '346 77% 50%', // Rojo
      logo: '/logos/demo.png',
    },
    industryType: 'gym', // Gimnasio
    createdAt: '2024-04-01',
    isActive: true,
    maxUsers: 3,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Global Solutions Ltd',
    plan: 'enterprise',
    activeModules: ['Dashboard', 'Users', 'Inventory', 'Customers', 'Billing', 'Settings'],
    featureFlags: ['crm', 'inventory', 'billing'],
    branding: {
      primaryColor: '199 89% 48%', // Cyan
      logo: '/logos/global.png',
    },
    industryType: 'restaurante', // Restaurante
    createdAt: '2024-01-05',
    isActive: true,
    maxUsers: 200,
    customDomain: 'global.dashboard.com',
  },
];

/**
 * Información de planes disponibles
 */
export const PLAN_INFO: Record<PlanType, {
  name: string;
  maxModules: number;
  maxUsers: number;
  price: string;
  features: string[];
  limitations: string; // Nota para el SuperAdmin
}> = {
  free: {
    name: 'Essential (Free)',
    maxModules: 1,
    maxUsers: 2,
    price: '$0',
    features: ['1 módulo básico', '2 usuarios', 'Soporte vía Comunidad', 'Branding de Plataforma'],
    limitations: 'Límite de 50 registros/mes. Sin acceso a módulos avanzados.',
  },
  starter: {
    name: 'Growth',
    maxModules: 3,
    maxUsers: 10,
    price: '$49/mes',
    features: ['Hasta 3 módulos', '10 usuarios', 'Soporte Email 24h', 'Gestión de Inventario inicial'],
    limitations: 'Límite de 500 registros/mes.',
  },
  professional: {
    name: 'Business',
    maxModules: 6,
    maxUsers: 50,
    price: '$149/mes',
    features: [
      'Hasta 6 módulos',
      '50 usuarios',
      'Soporte Prioritario',
      'Logo personalizado',
      'Reportes avanzados',
      'Módulo de POS'
    ],
    limitations: 'Límite de 5,000 registros/mes.',
  },
  enterprise: {
    name: 'Elite / Enterprise',
    maxModules: 999,
    maxUsers: 999,
    price: 'Personalizado',
    features: [
      'Ecosistema completo (All-in-one)',
      'Usuarios ilimitados',
      'Soporte 24/7 (WhatsApp/Call)',
      'Marca blanca total',
      'Dominio personalizado (HTTPS)',
      'Base de Datos aislada opcional',
    ],
    limitations: 'Sin límites técnicos operativos.',
  },
};

/**
 * Obtiene la configuración de un tenant por ID
 */
export function getTenantById(tenantId: string): TenantConfig | undefined {
  return TENANTS_CONFIG.find((tenant) => tenant.id === tenantId);
}

/**
 * Obtiene todos los tenants activos
 */
export function getActiveTenants(): TenantConfig[] {
  return TENANTS_CONFIG.filter((tenant) => tenant.isActive);
}

/**
 * Verifica si un tenant tiene acceso a un módulo específico
 */
export function tenantHasModule(tenantId: string, moduleId: string): boolean {
  const tenant = getTenantById(tenantId);
  return tenant?.activeModules.includes(moduleId) ?? false;
}

/**
 * Obtiene los módulos activos de un tenant
 */
export function getTenantModules(tenantId: string): string[] {
  const tenant = getTenantById(tenantId);
  return tenant?.activeModules ?? [];
}

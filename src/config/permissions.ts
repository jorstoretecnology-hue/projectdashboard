/**
 * Definición de todos los permisos disponibles en el sistema.
 * Seguir convención: modulo.accion
 */
export const PERMISSIONS = {
  // Clientes
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',

  // Inventario
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_DELETE: 'inventory.delete',
  INVENTORY_MANAGE: 'inventory.manage', // Retrocompatibilidad o acceso total

  // Facturación
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',

  // Usuarios y Configuración
  USERS_MANAGE: 'users.manage',
  SETTINGS_EDIT: 'settings.edit',
  
  // Ventas (POS / KDS)
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_MANAGE: 'sales.manage',

  // DIAN / Facturación Electrónica
  DIAN_VIEW: 'dian.view',
  DIAN_CREATE: 'dian.create',
  DIAN_MANAGE: 'dian.manage',
  DIAN_SYNC: 'dian.sync',

  // SuperAdmin
  CENTRAL_CONSOLE: 'admin.console',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Mapeo de Roles a Permisos.
 * Esto permite desacoplar la lógica del componente del rol específico.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS), // Acceso total
  OWNER: Object.values(PERMISSIONS), // Acceso total al tenant
  
  ADMIN: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.DIAN_VIEW,
    PERMISSIONS.DIAN_CREATE,
  ],

  EMPLOYEE: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SALES_VIEW,
  ],

  VIEWER: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
  ],
};

/**
 * Feature Flags (SaaS)
 * Determinan qué grandes bloques funcionales están habilitados para un Tenant.
 */
export const FEATURES = {
  CRM: 'crm',
  INVENTORY: 'inventory',
  BILLING: 'billing',
  SALES: 'sales',
  DIAN: 'dian',
} as const;

export type FeatureFlag = typeof FEATURES[keyof typeof FEATURES];

/**
 * Helper para verificar si un rol tiene un permiso.
 * Robusto contra mayúsculas/minúsculas.
 */
export function hasPermission(role: string | null, permission: Permission): boolean {
  if (!role) return false;
  
  // Normalizar para coincidir con las llaves de ROLE_PERMISSIONS
  const normalizedRole = role.toUpperCase();
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  
  return permissions.includes(permission);
}

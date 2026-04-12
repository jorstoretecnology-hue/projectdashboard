export type ModuleStatus = 'ACTIVE' | 'INACTIVE' | 'RESTRICTED' | 'DORMANT' | 'ERROR';

export interface ModuleNavItem {
  label: string;
  path: string;
  icon: string; // Lucide icon name — obligatorio ahora
}

export interface ActiveModule {
  key: string;
  status: ModuleStatus;
  permissions: string[];
  navigation: ModuleNavItem[];
}

// Definición canónica de todos los módulos disponibles en el sistema
// icon: nombre exacto del componente Lucide (https://lucide.dev/icons)
export const MODULE_DEFINITIONS: Record<string, Omit<ActiveModule, 'status'>> = {
  dashboard: {
    key: 'dashboard',
    permissions: ['dashboard.view'],
    navigation: [{ label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' }],
  },
  inventory: {
    key: 'inventory',
    permissions: ['inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete'],
    navigation: [{ label: 'Inventario', path: '/inventory', icon: 'Package' }],
  },
  customers: {
    key: 'customers',
    permissions: ['customers.view', 'customers.create', 'customers.update', 'customers.delete'],
    navigation: [{ label: 'Clientes', path: '/customers', icon: 'Users' }],
  },
  sales: {
    key: 'sales',
    permissions: ['sales.view', 'sales.create', 'sales.update', 'sales.delete'],
    navigation: [{ label: 'Ventas', path: '/sales', icon: 'ShoppingCart' }],
  },
  purchases: {
    key: 'purchases',
    permissions: ['purchases.view', 'purchases.create', 'purchases.update'],
    navigation: [{ label: 'Compras', path: '/purchases', icon: 'ShoppingBag' }],
  },
  reports: {
    key: 'reports',
    permissions: ['reports.view'],
    navigation: [{ label: 'Reportes', path: '/reports', icon: 'BarChart3' }],
  },
  billing: {
    key: 'billing',
    permissions: ['billing.view', 'billing.manage'],
    navigation: [{ label: 'Facturación', path: '/billing', icon: 'Receipt' }],
  },
  dian: {
    key: 'dian',
    permissions: ['dian.view', 'dian.create'],
    navigation: [
      {
        label: 'Facturación DIAN',
        path: '/dian',
        icon: 'FileText',
      },
    ],
  },
  settings: {
    key: 'settings',
    permissions: ['settings.view', 'settings.manage'],
    navigation: [{ label: 'Configuración', path: '/settings', icon: 'Settings' }],
  },
  users: {
    key: 'users',
    permissions: ['users.view', 'users.create', 'users.update', 'users.delete'],
    navigation: [{ label: 'Usuarios', path: '/users', icon: 'UserCog' }],
  },
  work_orders: {
    key: 'work_orders',
    permissions: ['work_orders.view', 'work_orders.create', 'work_orders.update'],
    navigation: [{ label: 'Órdenes de Trabajo', path: '/work-orders', icon: 'Wrench' }],
  },
  vehicles: {
    key: 'vehicles',
    permissions: ['vehicles.view', 'vehicles.create', 'vehicles.update'],
    navigation: [{ label: 'Vehículos', path: '/vehicles', icon: 'Car' }],
  },
  reservations: {
    key: 'reservations',
    permissions: ['reservations.view', 'reservations.create', 'reservations.update'],
    navigation: [{ label: 'Reservaciones', path: '/reservations', icon: 'CalendarCheck' }],
  },
  memberships: {
    key: 'memberships',
    permissions: ['memberships.view', 'memberships.create', 'memberships.update'],
    navigation: [{ label: 'Membresías', path: '/memberships', icon: 'BadgeCheck' }],
  },
  accommodations: {
    key: 'accommodations',
    permissions: ['accommodations.view', 'accommodations.create', 'accommodations.update'],
    navigation: [{ label: 'Alojamientos', path: '/accommodations', icon: 'BedDouble' }],
  },
  tables_events: {
    key: 'tables_events',
    permissions: ['tables_events.view', 'tables_events.create', 'tables_events.update'],
    navigation: [{ label: 'Mesas y Eventos', path: '/tables-events', icon: 'UtensilsCrossed' }],
  },
};

/**
 * Construye SOLO los módulos activos del tenant.
 * Anteriormente retornaba todos los módulos (activos e inactivos),
 * lo que causaba que el Sidebar no mostrara nada al filtrar por ACTIVE.
 *
 * @param activeModuleSlugs - slugs que vienen de tenant_modules (is_active = true)
 * @returns Solo los módulos con status ACTIVE, en el orden de los slugs del tenant
 */
export function buildActiveModules(activeModuleSlugs: string[]): ActiveModule[] {
  const normalizedSlugs = activeModuleSlugs.map((s) => s.toLowerCase());

  return normalizedSlugs
    .map((slug) => {
      const def = MODULE_DEFINITIONS[slug];
      if (!def) {
        // Slug en DB pero no en registry — loguear en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[ModuleRegistry] Slug desconocido: "${slug}" — agregar a MODULE_DEFINITIONS`,
          );
        }
        return null;
      }
      return { ...def, status: 'ACTIVE' as ModuleStatus };
    })
    .filter((m): m is ActiveModule => m !== null);
}

/**
 * Retorna todos los módulos del registry con su status real.
 * Útil para el panel de superadmin que muestra todos los módulos disponibles.
 */
export function buildAllModulesWithStatus(activeModuleSlugs: string[]): ActiveModule[] {
  const slugsSet = new Set(activeModuleSlugs.map((s) => s.toLowerCase()));

  return Object.values(MODULE_DEFINITIONS).map((def) => ({
    ...def,
    status: slugsSet.has(def.key) ? ('ACTIVE' as ModuleStatus) : ('INACTIVE' as ModuleStatus),
  }));
}

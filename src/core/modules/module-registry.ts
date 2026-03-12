export type ModuleStatus = 'ACTIVE' | 'INACTIVE' | 'RESTRICTED' | 'DORMANT' | 'ERROR'

export interface ActiveModule {
  key: string
  status: ModuleStatus
  permissions: string[]
  navigation?: { label: string; path: string; icon?: string }[]
}

export const MODULE_DEFINITIONS: Record<string, Omit<ActiveModule, 'status'>> = {
  dashboard:    { key: 'dashboard',    permissions: ['dashboard.view'],                                                                navigation: [{ label: 'Dashboard',          path: '/dashboard'    }] },
  inventory:    { key: 'inventory',    permissions: ['inventory.view','inventory.create','inventory.update','inventory.delete'],        navigation: [{ label: 'Inventario',          path: '/inventory'    }] },
  customers:    { key: 'customers',    permissions: ['customers.view','customers.create','customers.update','customers.delete'],        navigation: [{ label: 'Clientes',            path: '/customers'    }] },
  sales:        { key: 'sales',        permissions: ['sales.view','sales.create','sales.update','sales.cancel'],                        navigation: [{ label: 'Ventas',              path: '/sales'        }] },
  purchases:    { key: 'purchases',    permissions: ['purchases.view','purchases.create','purchases.receive'],                          navigation: [{ label: 'Compras',             path: '/purchases'    }] },
  work_orders:  { key: 'work_orders',  permissions: ['work_orders.view','work_orders.create','work_orders.update','work_orders.close'], navigation: [{ label: 'Órdenes de Trabajo', path: '/services'     }] },
  vehicles:     { key: 'vehicles',     permissions: ['vehicles.view','vehicles.create','vehicles.update'],                             navigation: [{ label: 'Vehículos',           path: '/vehicles'     }] },
  reservations: { key: 'reservations', permissions: ['reservations.view','reservations.create','reservations.cancel'],                 navigation: [{ label: 'Reservas',            path: '/reservations' }] },
  memberships:  { key: 'memberships',  permissions: ['memberships.view','memberships.create','memberships.update'],                    navigation: [{ label: 'Membresías',          path: '/memberships'  }] },
  reports:      { key: 'reports',      permissions: ['reports.view','reports.export'],                                                 navigation: [{ label: 'Reportes',            path: '/reports'      }] },
  billing:      { key: 'billing',      permissions: ['billing.view','billing.manage'],                                                 navigation: [{ label: 'Facturación',         path: '/billing'      }] },
  settings:     { key: 'settings',     permissions: ['settings.view','settings.update'],                                               navigation: [{ label: 'Configuración',       path: '/settings'     }] },
  users:        { key: 'users',        permissions: ['users.view','users.invite','users.manage'],                                      navigation: [{ label: 'Usuarios',            path: '/users'        }] },
}

export function buildActiveModules(activeModuleSlugs: string[]): ActiveModule[] {
  const slugsSet = new Set(activeModuleSlugs.map(s => s.toLowerCase()))
  return Object.values(MODULE_DEFINITIONS).map(def => ({
    ...def,
    status: slugsSet.has(def.key) ? 'ACTIVE' : 'INACTIVE',
  }))
}

export function isModuleActive(key: string, activeModuleSlugs: string[]): boolean {
  return activeModuleSlugs.map(s => s.toLowerCase()).includes(key.toLowerCase())
}

export function getActivePermissions(activeModuleSlugs: string[]): string[] {
  return buildActiveModules(activeModuleSlugs)
    .filter(m => m.status === 'ACTIVE')
    .flatMap(m => m.permissions)
}

// Hooks legacy — mantener por retrocompatibilidad
export function useModules(): ActiveModule[] {
  return buildActiveModules(['dashboard','inventory','customers','sales','settings','billing'])
}
export function useModule(key: string): ActiveModule | undefined {
  return useModules().find(m => m.key === key)
}

import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, Settings, Package,
  CreditCard, ShoppingCart, Wrench, Car,
  Calendar, Award, BarChart2
} from 'lucide-react'

export interface ModuleConfig {
  id: string
  name: string
  icon: LucideIcon
  path: string
  description?: string
  roles?: string[]
}

export const MODULES_CONFIG: ModuleConfig[] = [
  { id: 'dashboard',    name: 'Dashboard',         icon: LayoutDashboard, path: '/dashboard'   },
  { id: 'inventory',    name: 'Inventario',         icon: Package,         path: '/inventory'   },
  { id: 'customers',    name: 'Clientes',           icon: Users,           path: '/customers'   },
  { id: 'sales',        name: 'Ventas',             icon: ShoppingCart,    path: '/sales'       },
  { id: 'purchases',    name: 'Compras',            icon: CreditCard,      path: '/purchases'   },
  { id: 'work_orders',  name: 'Órdenes de Trabajo', icon: Wrench,          path: '/services'    },
  { id: 'vehicles',     name: 'Vehículos',          icon: Car,             path: '/vehicles'    },
  { id: 'reports',      name: 'Reportes',           icon: BarChart2,       path: '/reports'     },
  { id: 'billing',      name: 'Facturación',        icon: CreditCard,      path: '/billing'     },
  { id: 'settings',     name: 'Configuración',      icon: Settings,        path: '/settings'    },
  { id: 'users',        name: 'Usuarios',           icon: Users,           path: '/users'       },
]
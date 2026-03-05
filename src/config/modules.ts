import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Settings, Package, CreditCard } from 'lucide-react';


export interface ModuleConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  path: string;
  description?: string;
  roles?: string[]; // Roles permitidos para este módulo
}

export const MODULES_CONFIG: ModuleConfig[] = [
  { 
    id: 'Dashboard', 
    name: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/',
    description: 'Vista general del sistema',
    roles: ['superadmin', 'admin', 'user']
  },
  { 
    id: 'Users', 
    name: 'Usuarios', 
    icon: Users, 
    path: '/settings/team',
    description: 'Gestión de usuarios',
    roles: ['superadmin', 'admin']
  },
  { 
    id: 'Inventory', 
    name: 'Inventario', 
    icon: Package, 
    path: '/inventory',
    description: 'Control de inventario',
    roles: ['superadmin', 'admin', 'user']
  },
  { 
    id: 'Customers', 
    name: 'Clientes', 
    icon: Users, 
    path: '/customers',
    description: 'Nuestra cartera de clientes',
    roles: ['superadmin', 'admin', 'user']
  },
  { 
    id: 'Billing', 
    name: 'Facturación', 
    icon: CreditCard, 
    path: '/billing',
    description: 'Gestión de planes y facturación',
    roles: ['superadmin']
  },
  { 
    id: 'Sales', 
    name: 'Ventas', 
    icon: CreditCard, 
    path: '/sales',
    description: 'Ventas, POS y KDS',
    roles: ['superadmin', 'admin', 'user']
  },
  { 
    id: 'Settings', 
    name: 'Configuración', 
    icon: Settings, 
    path: '/settings',
    description: 'Configuración del sistema',
    roles: ['superadmin', 'admin']
  },
];
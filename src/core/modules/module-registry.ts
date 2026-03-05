import { ReactNode } from "react"

/**
 * Estados normalizados de un módulo
 * Deben reflejar el Module Engine
 */
export type ModuleStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "RESTRICTED"
  | "DORMANT"
  | "ERROR"

/**
 * Definición mínima de un módulo activo
 * Esta estructura NO debe contener lógica
 */
export interface ActiveModule {
  key: string
  status: ModuleStatus
  permissions: string[]
  navigation?: {
    label: string
    path: string
    icon?: ReactNode
  }[]
}

/**
 * Registry temporal (mock)
 * En el futuro se alimenta desde backend (Supabase)
 */
export const moduleRegistry: Record<string, ActiveModule> = {
  dashboard: {
    key: "dashboard",
    status: "ACTIVE",
    permissions: ["dashboard.view"],
    navigation: [
      {
        label: "Dashboard",
        path: "/dashboard",
      },
    ],
  },

  inventory: {
    key: "inventory",
    status: "ACTIVE",
    permissions: [
      "inventory.view",
      "inventory.create",
      "inventory.update",
      "inventory.delete",
    ],
    navigation: [
      {
        label: "Inventario",
        path: "/inventory",
      },
    ],
  },

  customers: {
    key: "customers",
    status: "ACTIVE",
    permissions: [
      "customers.view",
      "customers.create",
    ],
    navigation: [
      {
        label: "Clientes",
        path: "/customers",
      },
    ],
  },

  billing: {
    key: "billing",
    status: "ACTIVE",
    permissions: ["billing.view", "billing.manage"],
    navigation: [
      {
        label: "Facturación",
        path: "/billing",
      },
    ],
  },

  users: {
    key: "users",
    status: "ACTIVE",
    permissions: ["users.view", "users.manage"],
    navigation: [
      {
        label: "Usuarios",
        path: "/users",
      },
    ],
  },

  settings: {
    key: "settings",
    status: "ACTIVE",
    permissions: ["settings.view", "settings.update"],
    navigation: [
      {
        label: "Configuración",
        path: "/settings",
      },
    ],
  },
}

/**
 * Hooks de acceso
 * ❗ Toda la app debe usar SOLO estos
 */

export function useModules(): ActiveModule[] {
  return Object.values(moduleRegistry)
}

export function useModule(key: string): ActiveModule | undefined {
  return moduleRegistry[key]
}

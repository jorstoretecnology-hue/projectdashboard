/**
 * Definición de Niveles de Plan (Tiers)
 */
/**
 * Definición de Niveles de Plan (Tiers)
 * Debe coincidir con config/tenants.ts
 */
export type PlanTier = "free" | "starter" | "professional" | "enterprise"

/**
 * Estructura de Límites de un Plan
 */
export interface PlanLimits {
  // Módulos permitidos (si no está aquí, es INACTIVE)
  allowedModules: string[] 
  
  // Permisos restringidos explícitamente (Blacklist)
  // Ej: "customers.delete" para impedir borrar en planes bajos
  restrictedPermissions?: string[]

  // Límites numéricos (Quotas) - 0 = Ilimitado
  quotas: {
    maxUsers: number
    maxInventoryItems: number
    maxCustomers: number
  }

  // Funcionalidades específicas (Flags)
  features: {
    canExportData: boolean
    canCustomBranding: boolean
    canApiAccess: boolean
    supportLevel: "community" | "email" | "priority" | "dedicated"
  }
}

/**
 * Definición de los Planes
 */
export const PLANS: Record<PlanTier, PlanLimits> = {
  free: {
    allowedModules: ["dashboard", "inventory"], 
    restrictedPermissions: ["inventory.delete", "customers.create", "customers.delete"], // Backup restriction
    quotas: {
      maxUsers: 1,
      maxInventoryItems: 10,
      maxCustomers: 0,
    },
    features: {
      canExportData: false,
      canCustomBranding: false,
      canApiAccess: false,
      supportLevel: "community",
    },
  },

  starter: {
    allowedModules: ["dashboard", "inventory", "customers"],
    restrictedPermissions: ["customers.delete"], // No pueden borrar clientes
    quotas: {
      maxUsers: 3,
      maxInventoryItems: 100,
      maxCustomers: 50,
    },
    features: {
      canExportData: false,
      canCustomBranding: false,
      canApiAccess: false,
      supportLevel: "email",
    },
  },

  professional: {
    allowedModules: ["dashboard", "inventory", "customers", "users"],
    restrictedPermissions: [],
    quotas: {
      maxUsers: 10,
      maxInventoryItems: 1000,
      maxCustomers: 500,
    },
    features: {
      canExportData: true,
      canCustomBranding: true,
      canApiAccess: false,
      supportLevel: "priority",
    },
  },

  enterprise: {
    allowedModules: ["dashboard", "inventory", "customers", "users", "settings"],
    quotas: {
      maxUsers: 0, 
      maxInventoryItems: 0,
      maxCustomers: 0,
    },
    features: {
      canExportData: true,
      canCustomBranding: true,
      canApiAccess: true,
      supportLevel: "dedicated",
    },
  },
}

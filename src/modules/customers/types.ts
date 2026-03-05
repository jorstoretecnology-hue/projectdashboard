import { z } from "zod"
import { PERMISSIONS } from "@/config/permissions"

/**
 * Action Contract - Customers
 */
export const CUSTOMERS_ACTIONS = {
  create: {
    key: "create",
    label: "Nuevo Cliente",
    permission: PERMISSIONS.CUSTOMERS_CREATE,
    ui: "dialog",
  },
} as const

/**
 * Esquema de Validación (Zod)
 */
export const customerSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(["active", "inactive", "lead"]).default("active"),
  website: z.string().url("URL inválida").optional().or(z.literal('')),
  metadata: z.record(z.string(), z.any()).optional().default({}),
})

export type CustomerFormValues = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  companyName?: string
  taxId?: string
  address?: string
  notes?: string
  status: "active" | "inactive" | "lead"
  website?: string
  metadata?: Record<string, any>
}

export interface Customer extends CustomerFormValues {
  id: string
  createdAt?: string
}

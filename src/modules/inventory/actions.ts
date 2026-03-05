'use server'

import { createClient } from "@/lib/supabase/server"
import { can, getRequiredTenantId } from "@/lib/supabase/auth"
import { PERMISSIONS } from "@/config/permissions"
import { InventoryService } from "./services/inventory.service"
import { revalidatePath } from "next/cache"
import { InventoryFormValues, InventoryItem, inventoryItemSchema } from "./types"

/**
 * SERVER ACTIONS - Módulo de Inventario
 */

export async function createInventoryItemAction(rawData: InventoryFormValues): Promise<InventoryItem> {
  const supabase = await createClient()
  const inventoryService = new InventoryService(supabase)
  
  const tenantId = await getRequiredTenantId()

  if (!(await can(PERMISSIONS.INVENTORY_CREATE))) {
    throw new Error("ACCESO_DENEGADO: No tienes permiso para crear items de inventario.")
  }

  const data = inventoryItemSchema.parse(rawData)
  const result = await inventoryService.create(data, tenantId)
  
  revalidatePath('/inventory')
  return result
}

export async function updateInventoryItemAction(id: string, rawData: Partial<InventoryFormValues>): Promise<InventoryItem> {
  const supabase = await createClient()
  const inventoryService = new InventoryService(supabase)
  
  const tenantId = await getRequiredTenantId()

  if (!(await can(PERMISSIONS.INVENTORY_EDIT))) {
    throw new Error("ACCESO_DENEGADO: No tienes permiso para editar items de inventario.")
  }

  const data = inventoryItemSchema.partial().parse(rawData)
  const result = await inventoryService.update(id, data, tenantId)
  revalidatePath('/inventory')
  return result
}

export async function deleteInventoryItemAction(id: string): Promise<void> {
  const supabase = await createClient()
  const inventoryService = new InventoryService(supabase)
  
  const tenantId = await getRequiredTenantId()

  if (!(await can(PERMISSIONS.INVENTORY_DELETE))) {
    throw new Error("ACCESO_DENEGADO: No tienes permiso para eliminar items de inventario.")
  }

  await inventoryService.delete(id, tenantId)
  revalidatePath('/inventory')
}

/**
 * Contrato de Acciones (UI Metadata)
 */
export const INVENTORY_ACTIONS = {
  create: {
    key: "create",
    label: "Nuevo Ítem",
    permission: PERMISSIONS.INVENTORY_CREATE,
    ui: "dialog",
  },
  update: {
    key: "update",
    label: "Editar",
    permission: PERMISSIONS.INVENTORY_EDIT,
    ui: "dialog",
  },
  delete: {
    key: "delete",
    label: "Eliminar",
    permission: PERMISSIONS.INVENTORY_DELETE,
    ui: "confirm",
  },
} as const

export type InventoryActionKey = keyof typeof INVENTORY_ACTIONS

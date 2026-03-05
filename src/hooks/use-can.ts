"use client"

import { useUser } from "@/providers"
import { Permission } from "@/config/permissions"

/**
 * useCan
 * --------------------
 * Hook simple para verificar permisos granulares de usuario (RBAC).
 * 
 * @param permission El permiso a verificar
 * @returns boolean
 */
export function useCan(permission: Permission): boolean {
  const { can } = useUser()
  return can(permission)
}

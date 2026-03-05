"use client"

import { ReactNode } from "react"
import { usePermission } from "@/hooks/use-permission"

interface PermissionGuardProps {
  requiredPermission: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * PermissionGuard
 * --------------------
 * Componente wrapper para proteger elementos de UI basados en permisos.
 * 
 * @example
 * <PermissionGuard requiredPermission="inventory.create">
 *   <Button>Nuevo Item</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  requiredPermission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const hasAccess = usePermission(requiredPermission)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

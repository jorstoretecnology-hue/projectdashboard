"use client"

import { ReactNode } from "react"
import { useModuleContext } from "@/providers/ModuleContext"

interface ModuleGuardProps {
  module: string
  children: ReactNode
}

/**
 * ModuleGuard
 * --------------------
 * Controla si un módulo puede renderizarse o no.
 * ❌ No decide permisos
 * ❌ No redirecciona
 * ❌ No muestra mensajes
 *
 * Solo aplica gobernanza de módulos.
 */
export function ModuleGuard({ module, children }: ModuleGuardProps) {
  const { isModuleActive, isLoading } = useModuleContext()

  // Esperar a que cargue antes de decidir
  if (isLoading) return null

  // Si el módulo no está activo para este tenant, no renderizar
  if (!isModuleActive(module)) return null

  return <>{children}</>
}

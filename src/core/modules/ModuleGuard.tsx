"use client"

import { ReactNode } from "react"
import { useModule } from "./module-registry"

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
  const mod = useModule(module)

  // Módulo inexistente
  if (!mod) return null

  // Estados no renderizables
  if (mod.status !== "ACTIVE") return null

  return <>{children}</>
}

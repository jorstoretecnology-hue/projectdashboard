'use client'

// src/components/layout/Sidebar.tsx
//
// Fuente única de verdad: ModuleContext (lee de tenant_modules en Supabase)
// MODULES_CONFIG eliminado — ver DECISIONS.md [2026-04-04]

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useModuleContext } from '@/providers/ModuleContext'
import { cn } from '@/lib/utils'

// ─── IconRenderer ─────────────────────────────────────────────────────────────
// Convierte el string del nombre del icono (ej: 'Package') en el componente
// Lucide real mediante namespace import.
// Si el nombre no existe en Lucide, muestra Square como fallback y avisa
// en consola de desarrollo. Nunca rompe el layout.

function IconRenderer({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as
    | React.ComponentType<{ className?: string }>
    | undefined

  if (!Icon) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[IconRenderer] Icono "${name}" no existe en lucide-react. ` +
        `Verifica el campo icon en MODULE_DEFINITIONS (module-registry.ts)`
      )
    }
    return <LucideIcons.Square className={className} />
  }

  return <Icon className={className} />
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const { modules, isLoading } = useModuleContext()
  const [collapsed, setCollapsed] = useState(false)

  // ModuleContext ya retorna solo ACTIVE, pero el filtro aquí es
  // defensa en profundidad por si algo cambia en el contexto.
  const navItems = modules.filter(m => m.status === 'ACTIVE')

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Botón colapsar/expandir */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className={cn(
          'absolute -right-3 top-6 z-10',
          'flex h-6 w-6 items-center justify-center',
          'rounded-full border border-border bg-card shadow-sm',
          'hover:bg-muted transition-colors'
        )}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>

      {/* Logo */}
      <div className={cn(
        'flex h-14 shrink-0 items-center border-b border-border px-4',
        collapsed ? 'justify-center' : 'gap-2'
      )}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          A
        </span>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight">
            Antigravity
          </span>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">

        {/* Estado: cargando */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Estado: sin módulos (no debería ocurrir si la DB está bien) */}
        {!isLoading && navItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            {!collapsed && (
              <p className="text-xs text-muted-foreground px-2">
                Sin módulos activos.{' '}
                <br />
                Contacta al administrador.
              </p>
            )}
          </div>
        )}

        {/* Estado: módulos cargados */}
        {!isLoading && navItems.length > 0 &&
          navItems.map(module =>
            module.navigation.map(navItem => {
              const isActive =
                pathname === navItem.path ||
                (navItem.path !== '/dashboard' && pathname.startsWith(navItem.path))

              return (
                <Link
                  key={`${module.key}-${navItem.path}`}
                  href={navItem.path}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                    'transition-colors hover:bg-muted hover:text-foreground',
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? navItem.label : undefined}
                >
                  <IconRenderer
                    name={navItem.icon}
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate">{navItem.label}</span>
                  )}
                </Link>
              )
            })
          )
        }
      </nav>
    </aside>
  )
}

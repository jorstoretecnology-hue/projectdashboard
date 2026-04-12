'use client'

import { Layers, ArrowRight, Users, Package, Settings, ShieldCheck, Zap, Info } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useModuleContext } from '@/providers'

export function ModulesGrid() {
  const { modules } = useModuleContext()

  // ModuleContext ya retorna solo los módulos del tenant con status ACTIVE
  const contractedModules = modules

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Módulos Activos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las funcionalidades disponibles para tu organización
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Módulos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers size={20} className="text-primary" /> Módulos del Sistema
            </h2>
            <Link
              href="/settings"
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              Gestionar <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contractedModules.map((m) => {
              const nav = m.navigation[0]
              if (!nav) return null
              return (
                <Card
                  key={m.key}
                  className={cn(
                    'border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 group overflow-hidden',
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="p-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-colors"
                      >
                        <span className="text-xs font-bold">{nav.icon?.slice(0,2)}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-1">{nav.label}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-medium leading-snug">
                      Simplifica tus procesos corporativos con este módulo optimizado.
                    </p>
                    <Link href={nav.path}>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-9 rounded-lg hover:bg-primary/5 hover:text-primary p-0 px-2 font-bold group-hover:bg-primary/5"
                    >
                      Abrir módulo{' '}
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              )
            })}
          </div>
        </div>

        {/* Sidebar Column: Acciones & Apariencia */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="border-border/50 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl rounded-3xl overflow-hidden relative dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap size={18} className="text-primary" /> Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: 'Nuevo User', icon: Users, path: '/users' },
                { label: 'Añadir Item', icon: Package, path: '/inventory' },
                { label: 'Configurar', icon: Settings, path: '/settings' },
                { label: 'Soporte', icon: ShieldCheck, path: '#' },
              ].map((act, i) => (
                <Link key={i} href={act.path}>
                  <Button variant="outline" className="w-full flex flex-col items-center justify-center p-4 h-auto gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white hover:border-white/20 rounded-2xl transition-all">
                    <act.icon size={20} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {act.label}
                    </span>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Newsletter / Info */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <h4 className="font-bold text-indigo-500 flex items-center gap-2 mb-2">
              <Info size={16} /> Beta Features
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Estamos implementando la integración con IA para predicciones de stock. Mantente
              atento a las actualizaciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

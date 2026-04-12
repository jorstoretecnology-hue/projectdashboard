'use client'

import { Zap, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTenant } from '@/providers'

export function DashboardHero() {
  const { currentTenant } = useTenant()

  return (
    <div className="gradient-hero rounded-[2rem] p-8 sm:p-14 text-primary-foreground shadow-2xl animate-fade-in relative overflow-hidden group border border-primary/20">
      <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
        <Zap size={320} />
      </div>
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl dark:bg-primary-foreground/5" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-md px-4 py-1 text-xs font-bold uppercase tracking-wider"
          >
            {currentTenant?.plan || 'Standard'} Mode
          </Badge>
          <div className="h-1 w-1 bg-primary-foreground/40 rounded-full" />
          <span className="text-primary-foreground/60 text-xs font-medium">v2.4.0 Engine</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none text-primary-foreground">
            {currentTenant ? `Hola, ${currentTenant.name}` : 'Dashboard Universal'}
          </h1>
          <p className="text-primary-foreground/80 text-lg sm:text-xl leading-relaxed max-w-2xl font-medium">
            Gestiona tu infraestructura modular con herramientas de monitorización en tiempo real
            y componentes optimizados.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/reports">
            <Button variant="default" className="rounded-2xl h-12 px-8 font-bold text-base shadow-xl shadow-black/10">
              Ver Reportes <ArrowUpRight className="ml-2" size={18} />
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 rounded-2xl h-12 px-8 font-bold"
          >
            Documentación
          </Button>
        </div>
      </div>
    </div>
  )
}

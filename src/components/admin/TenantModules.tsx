'use client'

import { Package, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useModules, type Module } from '@/hooks/useModules'
import { cn } from '@/lib/utils'

interface TenantModulesProps {
  tenantId: string
  initialModules: Module[]
  currentPlan?: 'free' | 'starter' | 'professional' | 'enterprise'
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

export function TenantModules({ tenantId, initialModules, currentPlan = 'free' }: TenantModulesProps) {
  const { modules, toggleModule, syncByPlan, loading, planLoading, error } = useModules(tenantId, initialModules)
  const [syncConfirm, setSyncConfirm] = useState(false)

  const handleSync = async () => {
    try {
      await syncByPlan(currentPlan)
      setSyncConfirm(false)
    } catch {
      // Error already handled by hook
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Módulos del Tenant</CardTitle>
            <CardDescription>
              Gestiona los módulos activos para esta organización. Plan actual:{' '}
              <Badge variant="outline" className="font-bold">
                {PLAN_LABELS[currentPlan] || currentPlan}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!syncConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSyncConfirm(true)}
                disabled={planLoading}
                className="gap-2"
              >
                <RefreshCw size={14} className={cn(planLoading && 'animate-spin')} />
                Sincronizar con Plan
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="text-amber-400" />
                <span className="text-xs text-amber-200">¿Sincronizar?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleSync}
                  disabled={planLoading}
                  className="h-7 px-3 text-xs"
                >
                  {planLoading ? 'Sincronizando...' : 'Sí'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSyncConfirm(false)}
                  disabled={planLoading}
                  className="h-7 px-3 text-xs"
                >
                  No
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((mod) => {
            const isProcessing = loading === mod.module_slug
            return (
              <div
                key={mod.module_slug}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                  mod.is_active
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-muted/5 border-border/30 opacity-60'
                )}
              >
                <div className="flex items-center gap-3">
                  <Package
                    size={16}
                    className={mod.is_active ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <div>
                    <span className="text-sm font-bold uppercase">{mod.module_slug}</span>
                    {mod.expires_at && (
                      <p className="text-[10px] text-slate-500">
                        Expira: {new Date(mod.expires_at).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isProcessing ? (
                    <RefreshCw size={16} className="animate-spin text-primary" />
                  ) : mod.is_active ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : null}
                  <Switch
                    checked={mod.is_active}
                    onCheckedChange={(checked) => toggleModule(mod.module_slug, checked)}
                    disabled={isProcessing || planLoading}
                  />
                </div>
              </div>
            )
          })}
          {modules.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-8">
              No hay módulos asignados a este tenant.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Building2, Search, Filter, Users, CheckCircle2, XCircle, ArrowUpRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type IndustryType } from '@/types'

interface TenantConsole {
  id: string
  name: string
  industry_type: IndustryType | null
  specialty_slug: string | null
  plan: string | null
  is_active: boolean
  created_at: string
  profiles: { count: number }[]
}

export default async function TenantsPage() {
  const supabase = await createClient()

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      industry_type,
      specialty_slug,
      plan,
      is_active,
      created_at,
      profiles:profiles(count)
    `)
    .order('created_at', { ascending: false })

  const { data: industries } = await supabase
    .from('industries')
    .select('slug, name')
    .order('name')

  const tenantsData = (tenants as unknown as TenantConsole[]) || []
  const activeTenants = tenantsData.filter((t) => t.is_active)
  const totalUsers = tenantsData.reduce((sum: number, t) => {
    return sum + (t.profiles?.[0]?.count || 0)
  }, 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
            Gestión de Tenants
          </h1>
          <p className="text-slate-400 font-medium">
            {tenants?.length || 0} organizaciones registradas • {activeTenants.length} activas • {totalUsers} usuarios totales
          </p>
        </div>
        
        <Link 
          href="/onboarding" 
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
        >
          <Plus size={18} strokeWidth={3} />
          Nuevo Tenant
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tenants?.length || 0, color: 'text-white' },
          { label: 'Activos', value: activeTenants.length, color: 'text-emerald-500' },
          { label: 'Inactivos', value: (tenants?.length || 0) - activeTenants.length, color: 'text-red-400' },
          { label: 'Usuarios', value: totalUsers, color: 'text-blue-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <p className={cn("text-2xl font-black mt-1", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {tenantsData.map((tenant) => {
          const userCount = tenant.profiles?.[0]?.count || 0
          return (
            <Link key={tenant.id} href={`/console/tenants/${tenant.id}`}>
              <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-2xl hover:border-primary/50 cursor-pointer">
                <div
                  className={cn(
                    "absolute top-0 left-0 w-1 h-full transition-opacity",
                    tenant.is_active ? "bg-emerald-500 opacity-50 group-hover:opacity-100" : "bg-red-500/50"
                  )}
                />
                <CardContent className="p-6 pl-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/80 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xl transition-transform group-hover:scale-110">
                        {tenant.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg tracking-tight text-white">{tenant.name}</h3>
                          {tenant.is_active ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 size={10} /> ACTIVO
                            </div>
                          ) : (
                            <Badge variant="destructive" className="h-5 text-[9px]">INACTIVO</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-medium">
                          <span>{tenant.industry_type || 'Sin industria'}</span>
                          {tenant.specialty_slug && (
                            <>
                              <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                              <span>{tenant.specialty_slug}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight size={20} className="text-slate-600 group-hover:text-primary transition-colors" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/30">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Plan</p>
                      <Badge variant="outline" className="mt-1 font-bold text-xs">
                        {tenant.plan?.toUpperCase() || 'FREE'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Usuarios</p>
                      <p className="text-sm font-bold text-white mt-1 flex items-center gap-1">
                        <Users size={14} className="text-blue-400" /> {userCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Creado</p>
                      <p className="text-sm font-medium text-slate-300 mt-1">
                        {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {(!tenants || tenants.length === 0) && (
        <div className="text-center py-20 text-slate-500">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No hay tenants registrados</p>
        </div>
      )}
    </div>
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

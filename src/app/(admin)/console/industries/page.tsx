import { createClient } from '@/lib/supabase/server'
import { Factory, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Industry {
  slug: string
  name: string
  description: string | null
}

interface Specialty {
  slug: string
  name: string
  icon: string | null
  industry_slug: string
  is_active: boolean
}

interface TenantIndustryCount {
  industry_type: string | null
}

export default async function IndustriesPage() {
  const supabase = await createClient()

  const { data: industries } = await supabase
    .from('industries')
    .select('slug, name, description')
    .order('name')

  const { data: specialties } = await supabase
    .from('industry_specialties')
    .select('slug, name, icon, industry_slug, is_active')
    .order('name')

  // Count tenants per industry
  const { data: tenantCounts } = await supabase
    .from('tenants')
    .select('industry_type')

  const countMap: Record<string, number> = {}
  if (tenantCounts) {
    (tenantCounts as unknown as TenantIndustryCount[]).forEach((t) => {
      if (t.industry_type) countMap[t.industry_type] = (countMap[t.industry_type] || 0) + 1
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <Factory className="h-6 w-6 text-emerald-500" />
          </div>
          Industrias y Especialidades
        </h1>
        <p className="text-slate-400 font-medium">
          {industries?.length || 0} industrias con {specialties?.length || 0} especialidades
        </p>
      </div>

      <div className="space-y-4">
        {(industries as unknown as Industry[])?.map((industry) => {
          const specs = (specialties as unknown as Specialty[])?.filter((s) => s.industry_slug === industry.slug) || []
          const tenantCount = countMap[industry.slug] || 0

          return (
            <Card key={industry.slug} className="bg-slate-900/50 border-slate-800 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                      {industry.name}
                      <Badge variant="outline" className="text-[10px] font-bold">{industry.slug}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">{industry.description || 'Sin descripción'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Tenants</p>
                      <p className="text-lg font-black text-white">{tenantCount}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                      {specs.length} especialidades
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {specs.map((spec) => (
                    <div
                      key={spec.slug}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-slate-800/50 rounded-xl text-sm"
                    >
                      <span className="text-lg">{spec.icon || '🔧'}</span>
                      <span className="font-medium text-slate-300 truncate">{spec.name}</span>
                    </div>
                  ))}
                  {specs.length === 0 && (
                    <p className="text-slate-500 text-sm col-span-full">Sin especialidades definidas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

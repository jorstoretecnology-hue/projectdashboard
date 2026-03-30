import { createClient } from '@/lib/supabase/server'
import { Factory, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Industry {
  slug: string
  name: string
  description: string | null
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
          Industrias
        </h1>
        <p className="text-slate-400 font-medium">
          {industries?.length || 0} industrias configuradas
        </p>
      </div>

      <div className="space-y-4">
        {(industries as unknown as Industry[])?.map((industry) => (
          <Card key={industry.slug} className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">{industry.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 text-sm">
                {industry.description || `Configuración para ${industry.name}.`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

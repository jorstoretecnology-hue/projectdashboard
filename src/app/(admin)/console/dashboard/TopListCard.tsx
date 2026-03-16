import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { TopConsumer } from "@/modules/admin/services/saas-metrics.service"

interface TopListCardProps {
  title: string
  data: TopConsumer[]
  icon: LucideIcon
  color: 'blue' | 'violet'
}

const iconColors: Record<string, string> = {
  blue: "text-blue-500",
  violet: "text-violet-500",
}

export function TopListCard({ title, data, icon: Icon, color }: TopListCardProps) {
  return (
    <Card className="bg-card border border-border rounded-[1.5rem] shadow-sm overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
          <Icon className={cn("h-5 w-5", iconColors[color])} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-2">
        {data.length === 0 ? (
          <p className="text-xs text-slate-500 text-center italic py-4 font-semibold uppercase tracking-widest">
            Sin Data Analítica
          </p>
        ) : (
          <div className="space-y-6">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-600 group-hover:text-primary transition-colors">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-all underline decoration-transparent group-hover:decoration-primary/40 underline-offset-4">
                    {item.tenantName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {item.usage}
                  </span>
                  {item.percentUsed > 0 && (
                    <Badge variant="outline" className="text-[10px] font-black bg-secondary border-none py-0 px-2">
                      {item.percentUsed}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

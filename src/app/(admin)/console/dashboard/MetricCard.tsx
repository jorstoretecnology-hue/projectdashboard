import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend: string
  color: 'primary' | 'emerald' | 'blue' | 'violet'
}

const colorStyles: Record<string, string> = {
  primary: "bg-primary text-primary-foreground shadow-primary/20",
  emerald: "bg-emerald-500 text-white shadow-emerald-500/20",
  blue: "bg-blue-500 text-white shadow-blue-500/20",
  violet: "bg-violet-500 text-white shadow-violet-500/20",
}

export function MetricCard({ title, value, icon: Icon, trend, color }: MetricCardProps) {
  return (
    <Card className="bg-card border border-border rounded-[1.5rem] overflow-hidden shadow-sm hover:border-primary/50 transition-all group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4 flex-1">
            <div className="p-2 w-fit bg-secondary rounded-xl text-slate-400 group-hover:text-white transition-colors">
              <Icon size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic uppercase">
              <div className={cn("w-1.5 h-1.5 rounded-full", colorStyles[color].split(' ')[0])} />
              {trend}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

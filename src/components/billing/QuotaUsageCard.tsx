"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Info, AlertTriangle, AlertOctagon } from "lucide-react"

export interface QuotaUsageCardProps {
  title: string
  description?: string
  used: number
  limit: number | "unlimited"
  className?: string
}

export function QuotaUsageCard({
  title,
  description,
  used,
  limit,
  className,
}: QuotaUsageCardProps) {
  const isUnlimited = limit === "unlimited"
  let progressPercentage = 0
  
  if (!isUnlimited && limit > 0) {
    progressPercentage = Math.min((used / limit) * 100, 100)
  }

  // Determinación de estado visual
  let statusColorClass = "bg-primary"
  let StatusIcon = Info
  let statusIconColor = "text-muted-foreground"

  if (!isUnlimited) {
    if (progressPercentage >= 90) {
      statusColorClass = "bg-red-500"
      StatusIcon = AlertOctagon
      statusIconColor = "text-red-500"
    } else if (progressPercentage >= 70) {
       statusColorClass = "bg-amber-500"
       StatusIcon = AlertTriangle
       statusIconColor = "text-amber-500"
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
            </CardTitle>
            <StatusIcon className={cn("h-4 w-4", statusIconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1 text-2xl font-bold">
            {used}
            <span className="text-sm font-normal text-muted-foreground">
                / {isUnlimited ? "∞" : limit}
            </span>
        </div>
        
        {description && (
            <p className="text-xs text-muted-foreground mt-1 mb-3">
                {description}
            </p>
        )}

        <div className="mt-3">
            <Progress 
                value={isUnlimited ? 100 : progressPercentage} 
                className="h-2" 
                indicatorClassName={isUnlimited ? "bg-muted-foreground/30" : statusColorClass}
            />
        </div>
      </CardContent>
    </Card>
  )
}

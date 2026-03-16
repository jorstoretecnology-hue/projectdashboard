"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Store, Utensils, ShoppingCart, Hammer, Dumbbell, Tent, Music } from "lucide-react"
import type { IndustryType } from "@/config/industries"
import type { LucideIcon } from "lucide-react"

interface Industry {
  name: string
  icon: string
}

interface Step2IndustryProps {
  selectedIndustry: IndustryType | null
  onIndustrySelect: (industry: IndustryType) => void
  onNext: () => void
  onBack: () => void
  industries: Industry[]
}

type IconComponent = LucideIcon

const iconMap: Record<string, IconComponent> = {
  '🔧': Hammer,
  '🍽️': Utensils,
  '🛒': ShoppingCart,
  '🔨': Hammer,
  '💪': Dumbbell,
  '🏕️': Tent,
  '🕺': Music,
}

export function Step2Industry({
  selectedIndustry,
  onIndustrySelect,
  onNext,
  onBack,
  industries,
}: Step2IndustryProps) {
  const getIndustryIcon = (iconChar: string) => {
    return iconMap[iconChar] || Store
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {industries.map((ind) => {
          const Icon = getIndustryIcon(ind.icon)
          const indKey = ind.name.toLowerCase() as IndustryType

          return (
            <Card
              key={ind.name}
              onClick={() => onIndustrySelect(indKey)}
              className={cn(
                "cursor-pointer transition-all hover:scale-105 border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col items-center justify-center py-6 gap-3",
                selectedIndustry === indKey
                  ? "ring-2 ring-blue-500 border-transparent bg-slate-800"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white bg-slate-800",
                  selectedIndustry === indKey && "bg-blue-600"
                )}
              >
                <Icon size={24} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-white text-sm">{ind.name}</h3>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
          Atrás
        </Button>
        <Button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold"
          disabled={!selectedIndustry}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface InspectionChecklistProps {
  items: string[]
  completedItems: string[]
  onItemToggle: (item: string) => void
}

export function InspectionChecklist({ items, completedItems, onItemToggle }: InspectionChecklistProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card 
          key={item} 
          className={`p-3 flex items-center space-x-3 cursor-pointer transition-colors ${
            completedItems.includes(item) ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
          }`}
          onClick={() => onItemToggle(item)}
        >
          <Checkbox 
            id={`check-${item}`}
            checked={completedItems.includes(item)}
            onCheckedChange={() => onItemToggle(item)}
          />
          <Label 
            htmlFor={`check-${item}`}
            className="text-sm font-medium cursor-pointer flex-1"
          >
            {item}
          </Label>
        </Card>
      ))}
    </div>
  )
}

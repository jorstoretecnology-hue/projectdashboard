"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    
    // Intercept onChange to also trigger onCheckedChange if provided
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e)
      if (onCheckedChange) onCheckedChange(e.target.checked)
    }

    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-background checked:bg-primary checked:text-primary-foreground",
            className
          )}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <Check className="absolute left-[1px] top-[1px] h-3.5 w-3.5 hidden peer-checked:block text-slate-50 pointer-events-none" strokeWidth={3} />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

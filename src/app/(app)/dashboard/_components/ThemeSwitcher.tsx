'use client'

import { Sun, Moon, Laptop, CheckCircle2, Palette } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-md rounded-3xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette size={18} className="text-blue-500" /> Tema Global
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'light', name: 'Standard Light', icon: Sun },
            { id: 'dark', name: 'Deep Space Dark', icon: Moon },
            { id: 'system', name: 'Native OS', icon: Laptop },
          ].map((t) => (
            <Button
              key={t.id}
              variant={mounted && theme === t.id ? 'outline' : 'ghost'}
              onClick={() => setTheme(t.id)}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm h-auto',
                mounted && theme === t.id 
                  ? 'border-primary/50 bg-primary/5 text-primary shadow-sm' 
                  : 'text-muted-foreground',
              )}
            >
              <div className="flex items-center gap-3">
                <t.icon size={18} />
                {t.name}
              </div>
              {mounted && theme === t.id && <CheckCircle2 size={16} />}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

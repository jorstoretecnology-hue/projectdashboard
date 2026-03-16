"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

interface Step1IdentityProps {
  name: string
  onNameChange: (name: string) => void
  onNext: () => void
}

export function Step1Identity({ name, onNameChange, onNext }: Step1IdentityProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onNext()
  }

  return (
    <Card className="w-full max-w-md mx-auto border-slate-800 bg-slate-900/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/10 text-blue-500 ring-1 ring-blue-500/20">
          <Building2 size={32} />
        </div>
        <CardTitle className="text-xl text-white">¿Cómo se llama tu empresa?</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tenantName" className="text-slate-200">
              Nombre del Proyecto
            </Label>
            <Input
              id="tenantName"
              placeholder="Ej: Taller Mecánico FastFix"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
              autoFocus
              className="border-slate-700 bg-slate-950 text-white h-12 text-lg"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold"
            disabled={!name.trim()}
          >
            Continuar
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

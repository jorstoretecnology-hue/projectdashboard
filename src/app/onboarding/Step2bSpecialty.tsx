"use client"

import React, { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { IndustryType } from "@/config/industries"

interface Specialty {
  slug: string
  name: string
  icon: string | null
}

interface Step2bSpecialtyProps {
  selectedIndustry: IndustryType
  selectedSpecialty: string | null
  onSpecialtySelect: (specialty: string | null) => void
  onNext: () => void
  onBack: () => void
}

export function Step2bSpecialty({
  selectedIndustry,
  selectedSpecialty,
  onSpecialtySelect,
  onNext,
  onBack,
}: Step2bSpecialtyProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSpecialties() {
      setLoading(true)
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("industry_specialties")
        .select("slug, name, icon")
        .eq("industry_slug", selectedIndustry)
        .eq("is_active", true)
        .order("name")

      if (!error && data) {
        setSpecialties(data as Specialty[])
      }
      setLoading(false)
    }

    loadSpecialties()
  }, [selectedIndustry])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8">
      <div className="text-center mb-6">
        <p className="text-slate-400 text-sm">
          ¿Qué tipo de negocio describes mejor? (Opcional)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {/* Opción "General" siempre visible */}
        <Card
          onClick={() => onSpecialtySelect(null)}
          className={cn(
            "cursor-pointer transition-all hover:scale-105 border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col items-center justify-center py-5 gap-2",
            selectedSpecialty === null
              ? "ring-2 ring-blue-500 border-transparent bg-slate-800"
              : "opacity-70 hover:opacity-100"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white bg-slate-800",
              selectedSpecialty === null && "bg-blue-600"
            )}
          >
            <Sparkles size={20} />
          </div>
          <h3 className="font-semibold text-white text-xs text-center">General</h3>
        </Card>

        {/* Especialidades dinámicas */}
        {specialties.map((spec) => (
          <Card
            key={spec.slug}
            onClick={() => onSpecialtySelect(spec.slug)}
            className={cn(
              "cursor-pointer transition-all hover:scale-105 border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col items-center justify-center py-5 gap-2",
              selectedSpecialty === spec.slug
                ? "ring-2 ring-blue-500 border-transparent bg-slate-800"
                : "opacity-70 hover:opacity-100"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center bg-slate-800",
                selectedSpecialty === spec.slug && "bg-blue-600"
              )}
            >
              <span className="text-lg">{spec.icon || "📋"}</span>
            </div>
            <h3 className="font-semibold text-white text-xs text-center px-1">
              {spec.name}
            </h3>
          </Card>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
          Atrás
        </Button>
        <Button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { logger } from "@/lib/logger"
import { getAllIndustries } from "@/config/industries"
import type { IndustryType } from "@/config/industries"
import { Step1Identity } from "./Step1Identity"
import { Step2Industry } from "./Step2Industry"
import { Step3Plan } from "./Step3Plan"

export default function OnboardingPage() {
  const params = useSearchParams()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>(params.get('plan') || 'free')

  const industries = getAllIndustries()

  const handleNextStep = () => {
    if (step === 1 && !name.trim()) {
      return
    }
    if (step === 2 && !selectedIndustry) {
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/60 to-slate-950/90" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Configura tu Negocio</h1>
          <p className="text-slate-400">
            Paso {step} de 3: {step === 1 ? 'Identidad' : step === 2 ? 'Industria' : 'Selecciona tu Plan'}
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: NOMBRE */}
        {step === 1 && (
          <Step1Identity
            name={name}
            onNameChange={setName}
            onNext={handleNextStep}
          />
        )}

        {/* STEP 2: INDUSTRIA */}
        {step === 2 && (
          <Step2Industry
            selectedIndustry={selectedIndustry}
            onIndustrySelect={setSelectedIndustry}
            onNext={handleNextStep}
            onBack={handleBack}
            industries={industries}
          />
        )}

        {/* STEP 3: PLAN */}
        {step === 3 && (
          <Step3Plan
            name={name}
            selectedIndustry={selectedIndustry || 'taller'}
            selectedPlan={selectedPlan}
            onPlanSelect={setSelectedPlan}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}

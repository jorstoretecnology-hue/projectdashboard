"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

interface VerifyFormProps {
  email: string
  type: "signup" | "recovery" | "magiclink"
  onVerified: () => void
}

export function VerifyForm({ email, type, onVerified }: VerifyFormProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const redirectingRef = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || code.length < 6) {
      toast.error("Por favor, ingresa el código completo.")
      return
    }

    if (!email) {
      toast.error("Falta el correo electrónico para verificar.")
      return
    }

    setLoading(true)

    try {
      logger.log("[Verify] Calling verifyOtp", { email, type, codeLength: code.length })

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: type,
      })

      logger.log("[Verify] OTP response", { hasError: !!error, hasSession: !!data?.session, hasUser: !!data?.user })

      if (error) {
        toast.error(error.message || "Código inválido o expirado.")
        setLoading(false)
        return
      }

      toast.success("¡Cuenta verificada exitosamente!")
      onVerified()
    } catch (err) {
      logger.error("[Verify] Exception during OTP verification", { error: err })
      toast.error("Error inesperado al verificar el código.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] glass-card rounded-3xl p-10 border-white/5 text-center space-y-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <Mail size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight italic">Verifica tu Correo</h2>
        <p className="text-slate-400">
          Hemos enviado un código de verificación a <br/>
          <span className="text-primary font-bold">{email || "tu correo electrónico"}</span>
        </p>
      </div>
      <div className="p-4 glass-faint rounded-2xl text-sm text-slate-300">
        Ingresa el código que recibiste para continuar.
      </div>

      <form onSubmit={handleVerify} className="space-y-5">
        <div className="space-y-2 text-left">
          <Input
            id="code"
            type="text"
            placeholder="Ej. 12345678"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            required
            maxLength={8}
            className="h-14 text-center text-2xl tracking-widest border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-primary/50 rounded-xl"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-[0_8px_16px_-4px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={loading || code.length < 6}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Verificar Código"
          )}
        </Button>
      </form>

      <div className="pt-4">
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-white"
          onClick={() => window.location.href = "/auth/login"}
        >
          Volver al Inicio de Sesión
        </Button>
      </div>
    </div>
  )
}

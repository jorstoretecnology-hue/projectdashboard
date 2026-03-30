"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Eye, EyeOff, LayoutDashboard, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { isPasswordValid } from "@/lib/validations/password-validation"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const token = searchParams?.get('token')
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones para continuar.")
      return
    }

    if (!isPasswordValid(password)) {
      toast.error("La contraseña no cumple con los requisitos de seguridad.")
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success("Cuenta creada exitosamente")
        router.push(`/auth/verify?email=${encodeURIComponent(email)}&type=signup`)
      }
    } catch (err) {
      console.error(err)
      toast.error("Error inesperado al crear la cuenta.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!acceptedTerms) {
       toast.error("Debes aceptar los términos y condiciones para continuar.")
       return
    }

    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (err) {
      console.error(err)
      toast.error("Error al conectar con Google")
    }
  }

  // Se eliminó la pantalla de success porque ahora se redirige a /auth/verify

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-slate-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 text-white">
        <Image
          src="/images/login-bg.png"
          alt="Premium Background"
          fill
          className="object-cover opacity-40 invisible sm:visible"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-slate-950/80" />
      </div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[460px] space-y-8">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 glass-faint rounded-2xl animate-float">
              <LayoutDashboard className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Empieza con <span className="text-primary italic">Smart OS</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium">
                Crea tu cuenta profesional en segundos
              </p>
            </div>
          </div>

          {/* Register Card */}
          <div className="glass-card rounded-3xl p-8 sm:p-10 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-300 ml-1">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@negocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-primary/50 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-300 ml-1">
                  Define tu Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña robusta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-primary/50 pr-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="px-1">
                  <PasswordStrength password={password} />
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms}
                  onCheckedChange={(checked: boolean | string) => setAcceptedTerms(checked === true)}
                  className="mt-1 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-xs font-medium text-slate-400 leading-relaxed"
                  >
                    Acepto los <Link href="/legal/terms" className="text-primary hover:text-white transition-colors underline underline-offset-2">Términos y Condiciones</Link> y la <Link href="/legal/privacy" className="text-primary hover:text-white transition-colors underline underline-offset-2">Política de Privacidad</Link>.
                  </label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-[0_8px_16px_-4px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Crear mi Cuenta Premium"
                )}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0b0f19] px-4 text-slate-500 font-bold tracking-widest">
                  o regístrate con
                </span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>
          </div>

          {/* Footer Info */}
          <div className="flex flex-col items-center space-y-6">
            <p className="text-slate-400 text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link 
                href={`/auth/login${token ? `?token=${token}` : ''}`} 
                className="text-white font-bold hover:text-primary transition-colors underline decoration-primary/50 underline-offset-4"
              >
                Inicia sesión aquí
              </Link>
            </p>
            
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Protección de datos empresariales 256-bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

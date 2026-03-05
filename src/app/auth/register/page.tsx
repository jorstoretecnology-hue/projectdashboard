"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { isPasswordValid } from "@/lib/validations/password-validation"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
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
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${token ? `?invite_token=${token}` : ''}`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        setSuccess(true)
        toast.success("Cuenta creada exitosamente")
      }
    } catch (err: any) {
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

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
        <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <CheckCircle2 size={24} />
            </div>
            <CardTitle className="text-2xl font-bold text-white">¡Revisa tu correo!</CardTitle>
            <CardDescription className="text-slate-400">
              Hemos enviado un enlace de confirmación a <span className="text-white font-medium">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-500">
              Haz clic en el enlace del correo para activar tu cuenta y acceder al dashboard.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800" onClick={() => router.push(`/auth/login${token ? `?token=${token}` : ''}`)}>
              Volver al Inicio de Sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
      
      <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Crear Cuenta</CardTitle>
          <CardDescription className="text-slate-400">
            Únete para gestionar tu negocio de forma inteligente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-slate-700 bg-slate-950 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border-slate-700 bg-slate-950 pr-10 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms}
                onCheckedChange={(checked: boolean | string) => setAcceptedTerms(checked === true)}
                className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Acepto los <Link href="/legal/terms" className="text-blue-500 hover:underline">Términos y Condiciones</Link> y la <Link href="/legal/privacy" className="text-blue-500 hover:underline">Política de Privacidad</Link>.
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-400">O crea cuenta con</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-slate-700 bg-slate-950 text-white hover:bg-slate-800"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href={`/auth/login${token ? `?token=${token}` : ''}`} className="text-blue-500 hover:underline font-bold">
              Inicia Sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const router = useRouter()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const token = searchParams?.get('token')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cooldown) {
      toast.error('Espera unos segundos antes de reintentar.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        // Protección anti fuerza bruta: delay de 2s tras intento fallido
        setCooldown(true)
        setTimeout(() => setCooldown(false), 2000)
        return
      }

      if (data.user) {
        toast.success('Sesión iniciada correctamente')
        
        if (token) {
          router.push(`/auth/invite?token=${token}`)
        } else {
          router.push('/post-auth')
        }
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast.error('Error inesperado al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signOut()
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (err: any) {
      console.error(err)
      toast.error('Error al conectar con Google')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
      
      <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Bienvenido</CardTitle>
          <CardDescription className="text-slate-400">
            Ingresa tus credenciales o utiliza Google para acceder
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              disabled={loading || cooldown}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : cooldown ? (
                'Espera...'
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-400">O también</span>
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
            Continuar con Google
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            Al continuar, aceptas nuestros términos y condiciones.
          </p>
          <p className="w-full text-center text-sm text-slate-400 mt-4">
            ¿No tienes cuenta?{" "}
            <Link href={`/auth/register${token ? `?token=${token}` : ''}`} className="text-blue-500 hover:underline font-bold">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

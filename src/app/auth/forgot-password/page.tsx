'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Ingresa tu correo electrónico.')

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
      toast.success('¡Enlace enviado!')
    } catch (err) {
      console.error(err)
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />

      <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600/20 p-4 rounded-full">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {sent ? '¡Revisa tu correo!' : 'Recuperar Contraseña'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {sent
              ? `Hemos enviado un enlace de recuperación a ${email}. Revisa también tu bandeja de spam.`
              : 'Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="border-slate-700 bg-slate-950 text-white"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              className="w-full border-slate-700 text-white hover:bg-slate-800"
              onClick={() => { setSent(false); setEmail('') }}
            >
              Enviar a otro correo
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
          <Link href="/auth/login" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio de Sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

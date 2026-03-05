'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { isPasswordValid } from '@/lib/validations/password-validation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid(password)) {
      return toast.error('La contraseña no cumple con los requisitos de seguridad.')
    }

    if (password !== confirmPassword) {
      return toast.error('Las contraseñas no coinciden.')
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('¡Contraseña actualizada exitosamente!')
      router.push('/post-auth')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Error inesperado al actualizar la contraseña.')
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
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Nueva Contraseña
          </CardTitle>
          <CardDescription className="text-slate-400">
            Crea una contraseña segura para proteger tu cuenta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 12 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={12}
                className="border-slate-700 bg-slate-950 text-white"
              />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400">Las contraseñas no coinciden.</p>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold mt-2"
              disabled={loading || !isPasswordValid(password) || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

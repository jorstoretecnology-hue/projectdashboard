'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { acceptInvitationAction } from '@/modules/team/actions'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface InvitationData {
  token: string
  app_role: string
  status: string | null
  tenants: { name: string } | null
}

export default function InvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      if (!token) {
        setError('Token de invitación no encontrado.')
        setLoading(false)
        return
      }

      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 2. Buscar info de la invitación (usando el token directamente)
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*, tenants(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (fetchError || !data) {
        setError('La invitación no es válida o ya ha sido utilizada.')
      } else {
        setInvitation(data)
      }
      setLoading(false)
    }

    init()
  }, [token, supabase])

  const handleAccept = async () => {
    if (!token) return
    setIsAccepting(true)

    try {
      await acceptInvitationAction(token)
      toast.success('¡Bienvenido al equipo!')
      router.push('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aceptar la invitación'
      toast.error(message)
      setIsAccepting(false)
    }
  }

  const handleRedirectRegister = () => {
    router.push(`/auth/register?invite_token=${token}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-blue-500" />
          </div>
          <CardTitle className="text-2xl">Invitación de Equipo</CardTitle>
          <CardDescription className="text-slate-400">
            {error ? 'Hubo un problema' : `Te han invitado a unirte a ${invitation?.tenants?.name}`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          {error ? (
            <div className="flex flex-col items-center gap-2 text-red-400">
              <AlertCircle className="h-8 w-8" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-300">
                Has sido invitado con el rol de <strong>{invitation?.app_role}</strong>. 
                {user ? (
                  `Has iniciado sesión como ${user.email}. ¿Quieres unirte ahora?`
                ) : (
                  "Para unirte, necesitas crear una cuenta o iniciar sesión."
                )}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {!error && (
            <>
              {user ? (
                <Button 
                  onClick={handleAccept} 
                  disabled={isAccepting} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Aceptar y Unirse
                </Button>
              ) : (
                <div className="w-full space-y-3">
                    <Button onClick={handleRedirectRegister} className="w-full bg-blue-600 hover:bg-blue-700">
                        Registrarse para Unirse
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/auth/login?returnTo=/auth/invite?token=${token}`)} className="w-full border-slate-700">
                        Ya tengo cuenta, Iniciar Sesión
                    </Button>
                </div>
              )}
            </>
          )}
          
          <Button variant="ghost" onClick={() => router.push('/')} className="w-full text-slate-500">
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

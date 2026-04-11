'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/modules/auth/actions/logout'
import { logger } from '@/lib/logger'

import { Permission, hasPermission, FeatureFlag } from '@/config/permissions'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: string | null
  can: (permission: Permission) => boolean
  canAccessFeature: (feature: FeatureFlag) => boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ 
  children,
  initialSession = null,
  initialUser = null
}: { 
  children: React.ReactNode,
  initialSession?: Session | null,
  initialUser?: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser || initialSession?.user || null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Siempre empezar en loading para sincronizar rol
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const supabaseClient = createClient()

    // Sincronizar sesión inicial de forma segura con getUser()
    supabaseClient.auth.getUser().then(async ({ data: { user: initialUser }, error }) => {
      if (error) {
        logger.warn('[AuthContext] Error getting user:', error)
        // AUTO-RECOVERY: Si el JWT es inválido (usuario eliminado, token corrupto),
        // limpiar cookies locales para evitar que el error persista.
        // Esto elimina la necesidad de que el usuario limpie caché manualmente.
        if (error.message?.includes('does not exist') || 
            error.message?.includes('invalid') || 
            error.status === 403) {
          logger.log('[AuthContext] Auto-recovery: clearing stale session')
          await supabaseClient.auth.signOut({ scope: 'local' })
        }
        setUser(null)
        setSession(null)
        setRole(null)
        setIsLoading(false)
        return
      }

      setUser(initialUser)
      
      // Intentar obtener la sesión (aunque getUser es el preferido para validación)
      supabaseClient.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession)
      })

      if (initialUser) {
        supabaseClient.from('profiles')
          .select('app_role')
          .eq('id', initialUser.id)
          .single()
          .then(({ data }) => {
            setRole(data?.app_role || initialUser.app_metadata?.app_role || 'VIEWER')
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
      }
    })

    // Escuchar cambios en la autenticación - FIRMA ESTRICTA SUGERIDA (_unused_session)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
      // Log sanitizado para desarrollo
      if (process.env.NODE_ENV !== 'production') {
        logger.log(`[AuthContext] Auth Event: ${event}`)
      }
      
      // FIX DEADLOCK: El callback onAuthStateChange no debe ser asíncrono.
      // Delegamos la lógica pesada a una función separada en el ciclo de eventos (event loop).
      const processAuthChange = async () => {
        // VALIDACIÓN REAL: Ignoramos el objeto session del callback y consultamos al servidor
        const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser()
        
        if (userError || !currentUser) {
          if (userError) {
            logger.warn('[AuthContext] Auth Change Error:', userError)
            // AUTO-RECOVERY: Limpiar sesión local si el JWT es inválido
            if (userError.message?.includes('does not exist') || 
                userError.message?.includes('invalid') || 
                userError.status === 403) {
              logger.log('[AuthContext] Auto-recovery: clearing stale session on auth change')
              await supabaseClient.auth.signOut({ scope: 'local' })
            }
          }
          setUser(null)
          setSession(null)
          setRole(null)
        } else {
          setUser(currentUser)
          
          // Obtenemos la sesión de forma segura solo para tokens si es necesario
          const { data: { session: newSession } } = await supabaseClient.auth.getSession()
          setSession(newSession)
          
          // Sincronizar ROL desde base de datos
          const { data } = await supabaseClient.from('profiles')
            .select('app_role')
            .eq('id', currentUser.id)
            .single()
          
          const finalRole = data?.app_role || currentUser.app_metadata?.app_role || 'VIEWER'
          setRole(finalRole)
        }

        setIsLoading(false)

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          router.refresh()
        }

        if (event === 'SIGNED_OUT') {
          router.push('/auth/login')
          router.refresh()
        }
      };

      // Soltamos la microtarea para romper el deadlock del SDK
      Promise.resolve().then(processAuthChange);
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      await logoutAction()
    } catch (error: unknown) {
      // NEXT_REDIRECT is the expected behavior of Server Actions calling redirect()
      const err = error as { digest?: string; message?: string }
      if (err?.digest?.includes('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        return
      }
      logger.warn('Logout action failed, forcing client logout', error)
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    }
  }

  const checkPermission = (p: Permission) => {
    const jwtPermissions = (user?.app_metadata?.permissions as string[]) || []
    if (jwtPermissions.length > 0) return jwtPermissions.includes(p)
    return hasPermission(role, p)
  }

  const checkFeature = (f: FeatureFlag) => {
    const jwtFeatures = (user?.app_metadata?.features as string[]) || []
    return jwtFeatures.includes(f)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      can: checkPermission, 
      canAccessFeature: checkFeature, 
      isLoading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider')
  }
  return context
}

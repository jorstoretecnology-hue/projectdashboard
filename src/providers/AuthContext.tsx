'use client'

import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'

import type { Permission, FeatureFlag } from '@/config/permissions';
import { hasPermission } from '@/config/permissions'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'
import { logoutAction } from '@/modules/auth/actions/logout'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: string | null
  isLoading: boolean
  can: (permission: Permission) => boolean
  canAccessFeature: (flag: FeatureFlag) => boolean
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
  const lastEventRef = useRef<string | null>(null)

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
    // Escuchar cambios en la autenticación - FIRMA ESTRICTA SUGERIDA (_unused_session)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      // Log sanitizado para desarrollo
      if (process.env.NODE_ENV !== 'production') {
        logger.log(`[AuthContext] Auth Event: ${event}`)
      }

      // FIX: SIGNED_IN → solo hacer refresh la primera vez
      if (event === 'SIGNED_IN') {
        if (lastEventRef.current !== 'SIGNED_IN') {
          lastEventRef.current = 'SIGNED_IN'
          router.refresh()
        }
        return
      }

      // FIX: SIGNED_OUT → limpiar referencia y redirigir
      if (event === 'SIGNED_OUT') {
        lastEventRef.current = null
        router.push('/auth/login')
        return
      }

      // FIX: TOKEN_REFRESHED → NO hacer router.refresh()
      // El token se renueva en background — no recargar la UI
      if (event === 'TOKEN_REFRESHED') {
        return
      }

      // Otros eventos: actualizar estado normalmente
      const processAuthChange = async () => {
        const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !currentUser) {
          if (userError) {
            logger.warn('[AuthContext] Auth Change Error:', userError)
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

          const { data: { session: newSession } } = await supabaseClient.auth.getSession()
          setSession(newSession)

          const { data } = await supabaseClient.from('profiles')
            .select('app_role')
            .eq('id', currentUser.id)
            .single()

          const finalRole = data?.app_role || currentUser.app_metadata?.app_role || 'VIEWER'
          setRole(finalRole)
        }

        setIsLoading(false)
      };

      Promise.resolve().then(processAuthChange);
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = useCallback(async () => {
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
  }, [supabase.auth]);

  const checkPermission = useCallback((p: Permission) => {
    const jwtPermissions = (user?.app_metadata?.permissions as string[]) || []
    if (jwtPermissions.length > 0) return jwtPermissions.includes(p)
    return hasPermission(role, p)
  }, [user, role]);

  const checkFeature = useCallback((f: FeatureFlag) => {
    const jwtFeatures = (user?.app_metadata?.features as string[]) || []
    return jwtFeatures.includes(f)
  }, [user]);

  const value = useMemo(() => ({ 
    user, 
    session, 
    role, 
    can: checkPermission, 
    canAccessFeature: checkFeature, 
    isLoading, 
    signOut 
  }), [user, session, role, checkPermission, checkFeature, isLoading, signOut]);

  return (
    <AuthContext.Provider value={value}>
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

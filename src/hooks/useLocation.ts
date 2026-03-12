'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/providers'

export interface Location {
  id: string
  tenant_id: string
  name: string
  address: string | null
  city: string | null
  is_main: boolean
  is_active: boolean
}

export interface UserLocationAccess {
  location: Location
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
  can_read_sibling_locations: boolean
}

const STORAGE_KEY = 'ag_current_location_id'

export function useLocation() {
  const { user } = useUser()
  const supabase = createClient()
  const [locations, setLocations] = useState<UserLocationAccess[]>([])
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('user_locations')
          .select(`role, can_read_sibling_locations, locations(id, tenant_id, name, address, city, is_main, is_active)`)
          .eq('user_id', user.id)
          .eq('is_active', true)

        const mapped: UserLocationAccess[] = (data || [])
          .filter(d => d.locations)
          .map(d => ({
            location: d.locations as unknown as Location,
            role: d.role as UserLocationAccess['role'],
            can_read_sibling_locations: d.can_read_sibling_locations ?? false,
          }))

        setLocations(mapped)

        const savedId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
        const saved = mapped.find(l => l.location.id === savedId)
        const main  = mapped.find(l => l.location.is_main)
        setCurrentLocationId(saved?.location.id ?? main?.location.id ?? mapped[0]?.location.id ?? null)
      } catch (err) {
        console.error('[useLocation] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const currentAccess   = locations.find(l => l.location.id === currentLocationId)
  const currentLocation = currentAccess?.location ?? null
  const currentRole     = currentAccess?.role ?? null

  const switchLocation = useCallback((locationId: string) => {
    if (!locations.find(l => l.location.id === locationId)) return
    setCurrentLocationId(locationId)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, locationId)
  }, [locations])

  const canWriteHere = useCallback((resource: string): boolean => {
    if (!currentRole) return false
    if (currentRole === 'OWNER' || currentRole === 'ADMIN') return true
    if (currentRole === 'EMPLOYEE') {
      return ['sales', 'work_orders', 'inventory', 'customers'].includes(resource)
    }
    return false
  }, [currentRole])

  const canReadSiblings = useCallback(
    () => currentAccess?.can_read_sibling_locations ?? false,
    [currentAccess]
  )

  return {
    locations,
    currentLocation,
    currentRole,
    loading,
    switchLocation,
    canWriteHere,
    canReadSiblings,
    isAdmin: currentRole === 'OWNER' || currentRole === 'ADMIN',
  }
}

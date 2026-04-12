'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/providers'
import { logger } from '@/lib/logger'

export interface Payment {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description: string
  paid_at: string | null
  created_at: string
}

export function usePayments() {
  const { user } = useUser()
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.app_metadata?.tenant_id) return

    const fetchPayments = async () => {
      try {
        setIsLoading(true)
        const { data, error: pgError } = await supabase
          .from('payments')
          .select('id, amount, currency, status, description, paid_at, created_at')
          .eq('tenant_id', user.app_metadata.tenant_id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (pgError) throw pgError

        type PaymentRow = {
          id: string
          amount: number
          currency: string | null
          status: string
          description: string | null
          paid_at: string | null
          created_at: string | null
        }
        const rows = (data || []) as PaymentRow[]
        const mappedPayments: Payment[] = rows.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency || 'USD',
          status: (p.status as Payment['status']) || 'pending',
          description: p.description || '',
          paid_at: p.paid_at,
          created_at: p.created_at || new Date().toISOString()
        }))

        setPayments(mappedPayments)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar pagos'
        setError(msg)
        logger.error('usePayments: Error fetching payments', { error: err })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [user?.app_metadata?.tenant_id])

  return {
    payments,
    isLoading,
    error,
  }
}

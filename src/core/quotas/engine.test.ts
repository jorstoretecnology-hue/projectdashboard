import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuotaEngine } from './engine'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => {
  const mockRpc = vi.fn().mockResolvedValue({ error: null })
  return {
    createClient: () => ({ rpc: mockRpc })
  }
})

describe('QuotaEngine Atomic Operations', () => {
  let engine: QuotaEngine
  let supabaseMock: any

  beforeEach(() => {
    vi.clearAllMocks()
    engine = new QuotaEngine()
    // Recuperar la instancia del mock crudo expuesto por la fábrica
    supabaseMock = createClient()
  })

  describe('incrementUsage', () => {
    it('should call increment_tenant_quota rpc atomicaly', async () => {
      await engine.incrementUsage('tenant-123', 'maxUsers', 2)
      expect(supabaseMock.rpc).toHaveBeenCalledWith('increment_tenant_quota', {
        p_tenant_id: 'tenant-123',
        p_resource_key: 'maxUsers',
        p_amount: 2,
      })
    })
  })

  describe('decrementUsage', () => {
    it('should call decrement_tenant_quota rpc atomicaly', async () => {
      await engine.decrementUsage('tenant-123', 'maxUsers', 1)
      expect(supabaseMock.rpc).toHaveBeenCalledWith('decrement_tenant_quota', {
        p_tenant_id: 'tenant-123',
        p_resource_key: 'maxUsers',
        p_amount: 1,
      })
    })
  })
})

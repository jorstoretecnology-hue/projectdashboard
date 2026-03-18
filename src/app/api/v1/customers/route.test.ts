import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

// Mock quotaEngine antes de importar el route
vi.mock('@/core/quotas/engine', () => ({
  quotaEngine: {
    assertCanConsume: vi.fn(() => Promise.resolve()),
    incrementUsage: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { POST } from './route';

describe('Customers API POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a customer with enterprise fields', async () => {
    // 1. Auth Mock - usar UUID válido
    const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserId = 'admin-123e4567-e89b-12d3-a456-426614174001';
    
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          app_metadata: { tenant_id: mockTenantId, app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    // 2. DB Mock
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
           data: { id: 'c123e4567-e89b-12d3-a456-426614174002', first_name: 'John', company_name: 'Acme Corp' },
           error: null
        }),
      })),
    }));

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
         eq: vi.fn(() => ({
            eq: vi.fn(() => ({
               single: vi.fn().mockResolvedValue({ data: null, error: null }) // No duplicate email
            }))
         }))
      })),
      insert: mockInsert,
    });

    // 3. Request - usar camelCase (schema usa camelCase)
    const req = new NextRequest('http://localhost/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@acme.com',
        companyName: 'Acme Corp', // Enterprise field
        taxId: '123456789',
        status: 'lead'
      }),
    });

    // 4. Test
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.companyName).toBe('Acme Corp'); // camelCase porque el response usa camelCase
  });

  it('should return 400 when validation fails (invalid email)', async () => {
    // 1. Auth Mock - usar UUID válido
    const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserId = 'admin-123e4567-e89b-12d3-a456-426614174001';
    
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          app_metadata: { tenant_id: mockTenantId, app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    // 2. Request - usar camelCase
    const req = new NextRequest('http://localhost/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email', // Invalid
      }),
    });

    // 3. Test
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});

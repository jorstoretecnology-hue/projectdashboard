import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { POST } from './route';

describe('Customers API POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a customer with enterprise fields', async () => {
    // 1. Auth Mock
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          app_metadata: { tenant_id: 'tenant-1', app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    // 2. DB Mock
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ 
           data: { id: 'c1', first_name: 'John', company_name: 'Acme Corp' }, 
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

    // 3. Request
    const req = new NextRequest('http://localhost/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@acme.com',
        company_name: 'Acme Corp', // Enterprise field
        tax_id: '123456789',
        status: 'lead'
      }),
    });

    // 4. Test
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.company_name).toBe('Acme Corp');
  });

  it('should return 400 when validation fails (invalid email)', async () => {
    // 1. Auth Mock
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          app_metadata: { tenant_id: 'tenant-1', app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    // 2. Request
    const req = new NextRequest('http://localhost/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock de dependencias ANTES de importar el módulo bajo prueba
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// 2. Importar el módulo bajo prueba
import { POST } from './route'; 

describe('Products API POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a product when data is valid', async () => {
    // Auth Mock
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          app_metadata: { tenant_id: 'tenant-1', app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    // DB Mock - Insert Success
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'p1', name: 'Valid Product' }, error: null }),
      })),
    }));
    
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
         eq: vi.fn(() => ({
            eq: vi.fn(() => ({
               single: vi.fn().mockResolvedValue({ data: null, error: null }) // No duplicate SKU
            }))
         }))
      })),
      insert: mockInsert,
    });

    const req = new NextRequest('http://localhost/api/v1/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Valid Product',
        price: 150,
        stock: 10,
        industry_type: 'taller',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
  });

  it('should return 400 when validation fails', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          app_metadata: { tenant_id: 'tenant-1', app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/v1/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid',
        price: -50, // Invalid
        industry_type: 'taller',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});

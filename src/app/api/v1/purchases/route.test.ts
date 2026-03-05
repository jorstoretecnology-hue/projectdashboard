import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Constants (Valid V4 UUIDs)
const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const MOCK_TENANT_ID = '123e4567-e89b-12d3-a456-426614174001';
const MOCK_SUPPLIER_ID = '123e4567-e89b-12d3-a456-426614174002';
const MOCK_PROD_ID = '123e4567-e89b-12d3-a456-426614174003';
const MOCK_PO_ID = '123e4567-e89b-12d3-a456-426614174004';

// Mocks
const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  rpc: mockRpc,
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { POST as createPost } from './route'; 

describe('Purchases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a purchase order', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: MOCK_USER_ID, app_metadata: { tenant_id: MOCK_TENANT_ID, app_role: 'ADMIN' } } },
      error: null,
    });

    const mockBuilder = {
       select: vi.fn(() => ({
         single: vi.fn().mockResolvedValue({ data: { id: MOCK_PO_ID }, error: null })
       })),
       then: (resolve: any) => resolve({ data: null, error: null })
    };
    
    const mockInsert = vi.fn(() => mockBuilder);

    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const req = new NextRequest('http://localhost/api/v1/purchases', {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: MOCK_SUPPLIER_ID,
        items: [{ product_id: MOCK_PROD_ID, quantity: 10, unit_cost: 50 }],
        notes: 'Test Order'
      }),
    });

    const res = await createPost(req);
    const json = await res.json();
    
    if (res.status !== 201) console.log('FAIL JSON:', JSON.stringify(json, null, 2));

    expect(res.status).toBe(201);
    expect(mockInsert).toHaveBeenCalledTimes(2); 
  });
});

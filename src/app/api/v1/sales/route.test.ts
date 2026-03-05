import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Constants
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MOCK_TENANT_ID = '550e8400-e29b-41d4-a716-446655440002';
const MOCK_CUST_ID = '550e8400-e29b-41d4-a716-446655440003';
const MOCK_PROD_ID = '550e8400-e29b-41d4-a716-446655440004';
const MOCK_SALE_ID = '550e8400-e29b-41d4-a716-446655440005';

// Mocks
const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  rpc: mockRpc,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { POST } from './route';

describe('Sales API POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a sale successfully via RPC', async () => {
    // 1. Auth Mock
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: MOCK_USER_ID,
          app_metadata: { tenant_id: MOCK_TENANT_ID, app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    // 2. RPC Mock (Success)
    mockRpc.mockResolvedValue({
      data: { id: MOCK_SALE_ID, total: 100, status: 'success' },
      error: null,
    });

    // 3. Request
    const req = new NextRequest('http://localhost/api/v1/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: MOCK_CUST_ID,
        payment_method: 'CASH',
        items: [
          { product_id: MOCK_PROD_ID, quantity: 2 }
        ],
      }),
    });

    // 4. Test
    const res = await POST(req);
    const json = await res.json();
    
    // Debug info if fail
    if (res.status !== 201) console.log('Test Fail Response:', json);

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    // Verificamos que se llame al RPC con los datos correctos
    expect(mockRpc).toHaveBeenCalledWith('create_sale_transaction', expect.objectContaining({
      p_customer_id: MOCK_CUST_ID,
      p_tenant_id: MOCK_TENANT_ID,
      p_user_id: MOCK_USER_ID,
      p_payment_method: 'CASH',
      p_items: expect.arrayContaining([
        expect.objectContaining({ product_id: MOCK_PROD_ID, quantity: 2 })
      ])
    }));
  });

  it('should return 500 (or 409 if handled) if stock is insufficient', async () => {
    // 1. Auth Mock
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: MOCK_USER_ID, app_metadata: { tenant_id: MOCK_TENANT_ID, app_role: 'ADMIN' } },
      },
      error: null,
    });

    // 2. RPC Mock (Error Stock)
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'Stock insuficiente para producto' },
    });

    // 3. Request
    const req = new NextRequest('http://localhost/api/v1/sales', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: MOCK_CUST_ID,
        items: [{ product_id: MOCK_PROD_ID, quantity: 100 }],
      }),
    });

    // 4. Test
    const res = await POST(req);
    const json = await res.json();

    // Como el service lanza Error('Stock incuficiente'), el wrapper lo atrapa.
    // Error genérico -> 500 por defecto en nuestro wrapper actual (aunque loggea message).
    expect(res.status).toBe(500); 
    expect(json.error.message).toContain('Stock insuficiente');
  });
});

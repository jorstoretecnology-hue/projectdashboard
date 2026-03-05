import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Constants
const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const MOCK_TENANT_ID = '123e4567-e89b-12d3-a456-426614174001';
const MOCK_CUST_ID = '123e4567-e89b-12d3-a456-426614174002';
const MOCK_PROD_ID = '123e4567-e89b-12d3-a456-426614174003';

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

import { POST as createSale } from './route';

describe('Sales API - Restaurant Extension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a sale with restaurant metadata and item notes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: MOCK_USER_ID, app_metadata: { tenant_id: MOCK_TENANT_ID, app_role: 'ADMIN' } } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: { id: 'sale-123', total: 15.5, status: 'success' },
      error: null,
    });

    const restaurantPayload = {
      customer_id: MOCK_CUST_ID,
      payment_method: 'CASH',
      items: [
        {
          product_id: MOCK_PROD_ID,
          quantity: 1,
          unit_price: 15.5,
          notes: 'Sin cebolla, bien cocido' // Nota por item
        }
      ],
      metadata: {
        mesa: '5',
        zona: 'Terraza',
        pax: 2
      }
    };

    const req = new NextRequest('http://localhost/api/v1/sales', {
      method: 'POST',
      body: JSON.stringify(restaurantPayload),
    });

    const res = await createSale(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(mockRpc).toHaveBeenCalledWith('create_sale_transaction', expect.objectContaining({
      p_metadata: restaurantPayload.metadata,
      p_items: expect.arrayContaining([
        expect.objectContaining({ notes: 'Sin cebolla, bien cocido' })
      ])
    }));
  });
});

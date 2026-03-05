import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Constants (Valid V4 UUIDs)
const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const MOCK_TENANT_ID = '123e4567-e89b-12d3-a456-426614174001';
const MOCK_CUST_ID = '123e4567-e89b-12d3-a456-426614174002';
const MOCK_VEHICLE_ID = '123e4567-e89b-12d3-a456-426614174003';
const MOCK_SERVICE_ID = '123e4567-e89b-12d3-a456-426614174004';
const MOCK_TECH_ID = '123e4567-e89b-12d3-a456-426614174005';

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

import { POST as createVehicle } from './vehicles/route';
import { POST as createOrder } from './orders/route';

describe('Services API (Workshop)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a vehicle', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: MOCK_USER_ID, app_metadata: { tenant_id: MOCK_TENANT_ID, app_role: 'ADMIN' } } },
      error: null,
    });

    // Mock vehicle uniqueness check (returns null = no exists)
    const mockSelectCheck = vi.fn().mockResolvedValue({ data: null, error: null });
    
    // Mock insert
    const mockBuilder = {
       select: vi.fn(() => ({
         single: vi.fn().mockResolvedValue({ data: { id: MOCK_VEHICLE_ID, plate: 'ABC-123' }, error: null })
       })),
       then: (resolve: any) => resolve({ data: null, error: null })
    };
    
    // Configurar comportamiento de 'from' segun tabla
    mockFrom.mockImplementation((table) => {
        if (table === 'vehicles') {
            return {
                select: () => ({ eq: () => ({ eq: () => ({ single: mockSelectCheck }) }) }), // Mock check uniqueness
                insert: () => mockBuilder
            };
        }
        return {};
    });

    const req = new NextRequest('http://localhost/api/v1/services/vehicles', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: MOCK_CUST_ID,
        brand: 'Toyota',
        model: 'Corolla',
        plate: 'ABC-123',
        year: 2020
      }),
    });

    const res = await createVehicle(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.plate).toBe('ABC-123');
  });

  it('should create a service order', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: MOCK_USER_ID, app_metadata: { tenant_id: MOCK_TENANT_ID, app_role: 'ADMIN' } } },
      error: null,
    });

    const mockBuilder = {
       select: vi.fn(() => ({
         single: vi.fn().mockResolvedValue({ data: { id: MOCK_SERVICE_ID, state: 'RECIBIDO' }, error: null })
       })),
       then: (resolve: any) => resolve({ data: null, error: null })
    };

    mockFrom.mockImplementation((table) => {
        if (table === 'services') {
            return {
                insert: () => mockBuilder
            };
        }
        return {};
    });

    const req = new NextRequest('http://localhost/api/v1/services/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: MOCK_CUST_ID,
        vehicle_id: MOCK_VEHICLE_ID,
        description: 'Cambio de aceite',
        priority: 'NORMAL'
      }),
    });

    const res = await createOrder(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.state).toBe('RECIBIDO');
  });
});

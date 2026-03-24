import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks del cliente Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Importamos un endpoint real para testear (ej. Customers)
import { POST as createCustomer } from '@/app/api/v1/customers/route';

// Mocks de core para evitar fallos en service
vi.mock('@/core/quotas/engine', () => ({
  quotaEngine: {
    assertCanConsume: vi.fn().mockResolvedValue(true),
    incrementUsage: vi.fn().mockResolvedValue(true),
  }
}));

vi.mock('@/core/security/audit.service', () => ({
  AuditLogService: vi.fn().mockImplementation(() => ({
    logResourceCreate: vi.fn().mockResolvedValue(true),
    logResourceUpdate: vi.fn().mockResolvedValue(true),
    logResourceDelete: vi.fn().mockResolvedValue(true),
  }))
}));

describe('Security: Cross-Tenant Isolation', () => {
  const TENANT_A = '00000000-0000-0000-0000-00000000000a';
  const TENANT_B = '00000000-0000-0000-0000-00000000000b';
  const USER_A = 'user-aaa-aaa-aaa';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent User A (Tenant A) from creating resources in Tenant B', async () => {
    // Simulamos sesión de Usuario A perteneciente a Tenant A
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: USER_A,
          app_metadata: { tenant_id: TENANT_A, app_role: 'ADMIN' },
        },
      },
      error: null,
    });

    // Intentamos enviar un payload que explícitamente pide Tenant B (si el endpoint lo permitiera)
    // Pero el service debe forzar el tenant_id de la sesión.
    const req = new NextRequest('http://localhost/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Hacker',
        lastName: 'Doe',
        email: 'hacker@example.com',
        tenantId: TENANT_B // Intento de inyección de tenant ajeno
      }),
    });

    // Mock del insert para capturar con qué tenant_id se intenta guardar
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      })
    });

    mockFrom.mockImplementation((table) => {
        if (table === 'customers') {
            return {
                select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null }) }) }) }),
                insert: mockInsert
            };
        }
        return {};
    });

    await createCustomer(req);

    // Verificación CRÍTICA: El insert DEBE usar TENANT_A (de la sesión) y NO TENANT_B (del body)
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      tenant_id: TENANT_A
    }));
    
    // Verificamos que NO se llamó con TENANT_B
    const callArgs = mockInsert.mock.calls[0][0];
    expect(callArgs.tenant_id).not.toBe(TENANT_B);
  });
});

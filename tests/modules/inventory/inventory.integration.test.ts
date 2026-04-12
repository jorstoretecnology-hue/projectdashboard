import { describe, it, expect, vi, beforeEach } from 'vitest';

import { quotaEngine } from '@/core/quotas/engine';
import { can, getRequiredTenantId } from '@/lib/supabase/auth';
import { createInventoryItemAction } from '@/modules/inventory/actions';

// 1. Mocks de Infraestructura
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  ),
}));

vi.mock('@/lib/supabase/auth', () => ({
  can: vi.fn(),
  getRequiredTenantId: vi.fn(),
}));

vi.mock('@/core/quotas/engine', () => ({
  quotaEngine: {
    assertCanConsume: vi.fn(),
    incrementUsage: vi.fn(),
    decrementUsage: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock de logs para evitar ruido en consola de tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Inventory Integration Tests (Actions)', () => {
  const mockTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const validProduct = {
    name: 'Aceite Sintético 5W30',
    description: 'Lubricante premium para motores',
    type: 'product' as const,
    industry_type: 'taller' as const,
    category: 'Consumibles',
    price: 45000,
    stock: 10,
    sku: 'OIL-001',
    metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getRequiredTenantId as any).mockResolvedValue(mockTenantId);
    (can as any).mockResolvedValue(true); // Permiso por defecto
  });

  it('debe crear un ítem de inventario con éxito', async () => {
    const result = await createInventoryItemAction(validProduct);

    // Verificaciones
    expect(can).toHaveBeenCalledWith('INVENTORY_CREATE');
    expect(quotaEngine.assertCanConsume).toHaveBeenCalledWith(mockTenantId, 'maxInventoryItems');
    expect(quotaEngine.incrementUsage).toHaveBeenCalledWith(mockTenantId, 'maxInventoryItems');
    expect(result).toBeDefined();
    expect(result.id).toBe('mock-id');
  });

  it('debe fallar si el usuario no tiene permisos', async () => {
    (can as any).mockResolvedValue(false);

    await expect(createInventoryItemAction(validProduct)).rejects.toThrow('ACCESO_DENEGADO');

    expect(quotaEngine.assertCanConsume).not.toHaveBeenCalled();
  });

  it('debe fallar si se excede la quota', async () => {
    (quotaEngine.assertCanConsume as any).mockRejectedValue(new Error('QUOTA_EXCEEDED'));

    await expect(createInventoryItemAction(validProduct)).rejects.toThrow('QUOTA_EXCEEDED');
  });

  it('debe validar el esquema Zod (Stock Negativo)', async () => {
    const invalidProduct = { ...validProduct, stock: -5 };

    await expect(createInventoryItemAction(invalidProduct)).rejects.toThrow(); // Zod error
  });

  it('debe validar el esquema Zod (Precio Negativo)', async () => {
    const invalidProduct = { ...validProduct, price: -100 };

    await expect(createInventoryItemAction(invalidProduct)).rejects.toThrow(); // Zod error
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from './sales.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Mock del logger para evitar ensuciar la salida en consola durante los tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('SalesService', () => {
  let mockSupabase: any;
  let salesService: SalesService;
  const tenantId = 'test-tenant-id';

  beforeEach(() => {
    // Restaurar los mocks antes de cada test
    vi.clearAllMocks();

    // Crear un mock del cliente de Supabase
    mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(),
    };

    // Inicializar el servicio con el mock
    salesService = new SalesService(mockSupabase as unknown as SupabaseClient, tenantId);
  });

  describe('Inicialización y Conexión', () => {
    it('debería instanciar el servicio correctamente con el tenant configurado', () => {
      expect(salesService).toBeInstanceOf(SalesService);
    });
  });

  describe('createSaleTransaction', () => {
    it('debería llamar a la función RPC create_sale_transaction correctamente', async () => {
      // Configurar el mock de supabase.rpc para que resuelva exitosamente
      const mockResult = { id: 'sale-123' };
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockResult, error: null });

      const saleData = {
        customer_id: 'cust-1',
        payment_method: 'CASH',
        discount: 0,
        tax_rate: 0.19,
        items: [{ product_id: 'prod-1', quantity: 2, unit_price: 100 }],
        notes: 'Venta de prueba',
      } as any;
      
      const userId = 'user-1';

      const result = await salesService.createSaleTransaction(saleData, userId);

      // Verificar que el resultado sea el esperado
      expect(result).toBe(mockResult);

      // Verificar que RPC fue llamado con los parámetros correctos
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_sale_transaction', {
        p_tenant_id: tenantId,
        p_user_id: userId,
        p_customer_id: saleData.customer_id,
        p_payment_method: saleData.payment_method,
        p_discount: saleData.discount,
        p_tax_rate: saleData.tax_rate,
        p_notes: saleData.notes,
        p_items: saleData.items,
        p_metadata: {},
      });
    });

    it('debería lanzar un error si stock es insuficiente (P0001)', async () => {
      // Configurar el mock de supabase.rpc para simular un error
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'P0001', message: 'Stock insuficiente' }
      });

      const saleData = {
        customer_id: 'cust-1',
        items: [],
      } as any;

      await expect(salesService.createSaleTransaction(saleData, 'user-1'))
        .rejects
        .toThrow('Stock insuficiente');

      // Verificar que el logger registró el error
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

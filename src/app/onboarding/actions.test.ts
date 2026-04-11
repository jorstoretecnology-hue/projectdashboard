import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTenantAction } from './actions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { emailService } from '@/modules/notifications/email.service';

// --- Mocks ---

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/config/industries', () => ({
  getIndustryConfig: vi.fn(() => ({
    defaultModules: ['Dashboard', 'Settings'],
  })),
}));

vi.mock('@/modules/notifications/email.service', () => ({
  emailService: {
    sendWelcomeEmail: vi.fn(() => Promise.resolve()),
  },
}));

// --------------

describe('Onboarding Actions - createTenantAction', () => {
  let mockSupabase: any;
  let mockAuthGetUser: any;
  let mockRpc: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthGetUser = vi.fn();
    mockRpc = vi.fn();

    // Setup base del mock de Supabase
    mockSupabase = {
      auth: {
        getUser: mockAuthGetUser,
      },
      rpc: mockRpc,
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('debería lanzar un error si Zod detecta un nombre muy corto', async () => {
    // Validar Inputs falla antes de llamar a supabase
    await expect(createTenantAction('a', 'free', 'taller'))
      .rejects
      .toThrow('El nombre de la organización es demasiado corto');
  });

  it('debería lanzar un error si el usuario no está autenticado', async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not logged in' } 
    });

    await expect(createTenantAction('Test Org', 'free', 'taller'))
      .rejects
      .toThrow('No autorizado: Debes iniciar sesión primero.');
  });

  it('debería lanzar un error si inicializar el tenant por RPC falla', async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    });

    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB Error' }
    });

    await expect(createTenantAction('Test Org', 'free', 'taller'))
      .rejects
      .toThrow('Fallo técnico al inicializar organización: DB Error.');

    // Validar que se llamó para inicializar el tenant
    expect(mockRpc).toHaveBeenCalledWith('initialize_new_organization', expect.any(Object));
  });

  it('debería crear el tenant, activar módulos y enviar email de bienvenida exitosamente', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com', user_metadata: { full_name: 'Test User' } } },
      error: null
    });

    // Simulamos la respuesta de ambos rpc:
    // Primer RPC devuelve el tenantId
    mockRpc.mockResolvedValueOnce({ data: 'new-tenant-id', error: null });
    // Segundo RPC (activar módulos) devuelve éxito
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const tenantId = await createTenantAction('Test Org', 'pro', 'taller', 'Mecanica');

    // Mutiples validaciones
    expect(tenantId).toBe('new-tenant-id');
    expect(mockRpc).toHaveBeenCalledTimes(2);
    
    // Validar llamada al RPC 1
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'initialize_new_organization', {
      p_name: 'Test Org',
      p_plan: 'pro',
      p_industry: 'taller',
      p_user_id: 'user-123',
      p_modules: ['Dashboard', 'Settings'],
      p_specialty: 'Mecanica'
    });

    // Validar llamada al RPC 2
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'activate_modules_for_tenant', {
      p_tenant_id: 'new-tenant-id',
      p_plan_slug: 'pro'
    });

    // Validar servicio de email
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'Test User');

    // Validar revalidatePath
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

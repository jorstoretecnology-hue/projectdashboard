import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';

// 1. Mock de dependencias externas (Next.js y Supabase)
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(),
    },
  }),
}));

// 2. Mock de la configuración de módulos
// Definimos 3 módulos para probar el filtrado
vi.mock('@/config/modules', () => ({
  MODULES_CONFIG: [
    { id: 'Dashboard', name: 'Dashboard', path: '/dashboard', icon: () => <div /> },
    { id: 'Users', name: 'Usuarios', path: '/users', icon: () => <div /> },
    { id: 'Inventory', name: 'Inventario Avanzado', path: '/inventory', icon: () => <div /> },
  ],
}));

// 3. Mock de los Providers (Contexto del Tenant)
const mockCurrentTenant = {
  id: '550e8400-e29b-41d4-a716-446655440000', // UUID válido
  name: 'Empresa Demo S.A.',
  plan: 'starter',
  // Simulamos que este tenant SOLO tiene acceso a Dashboard y Usuarios
  activeModules: ['Dashboard', 'Users'], 
  branding: {
    primaryColor: '220 100% 50%',
  },
};

vi.mock('@/providers', () => ({
  useModuleContext: () => ({
    // Simulamos la función isModuleActive
    isModuleActive: (id: string) => mockCurrentTenant.activeModules.includes(id),
  }),
  useTenant: () => ({
    currentTenant: mockCurrentTenant,
    isLoading: false,
    isSuperAdmin: false,
  }),
  useUser: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    role: 'OWNER',
    signOut: vi.fn(),
    can: () => true,
    canAccessFeature: () => true,
  }),
}));

describe('Sidebar Component (SaaS Logic)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente SOLO los módulos activos del tenant', () => {
    render(<Sidebar />);

    // ✅ Deben aparecer
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();

    // ❌ NO debe aparecer (Módulo restringido para este tenant)
    expect(screen.queryByText('Inventario Avanzado')).not.toBeInTheDocument();
  });

  it('muestra la información del tenant y su plan', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Empresa Demo S.A.')).toBeInTheDocument();
    expect(screen.getByText('STARTER')).toBeInTheDocument(); // El componente aplica .toUpperCase()
  });
});
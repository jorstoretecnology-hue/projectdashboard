import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import type { ActiveModule } from '@/core/modules/module-registry';

// 1. Mock de dependencias externas (Next.js)
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// 2. Mock de ModuleContext — usamos la nueva interfaz ActiveModule
const mockModules: ActiveModule[] = [
  {
    key: 'dashboard',
    status: 'ACTIVE',
    permissions: ['dashboard.view'],
    navigation: [{ label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    key: 'customers',
    status: 'ACTIVE',
    permissions: ['customers.view'],
    navigation: [{ label: 'Clientes', path: '/customers', icon: 'Users' }],
  },
  // 'inventory' NO incluido — simulamos que este tenant no lo tiene contratado
];

vi.mock('@/providers/ModuleContext', () => ({
  useModuleContext: () => ({
    modules: mockModules,
    activeModuleSlugs: mockModules.map((m) => m.key),
    isModuleActive: (slug: string) => mockModules.some((m) => m.key === slug),
    isLoading: false,
    mounted: true,
    toggleModule: vi.fn(),
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
    expect(screen.getByText('Clientes')).toBeInTheDocument();

    // ❌ NO debe aparecer (Módulo no contratado por este tenant)
    expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
  });

  it('no muestra el mensaje de error cuando hay módulos activos', () => {
    render(<Sidebar />);
    expect(screen.queryByText(/Sin módulos activos/i)).not.toBeInTheDocument();
  });
});
# PROMPT PARA ANTIGRAVITY — Mejoras arquitectónicas del SaaS

## Contexto del proyecto

Estás trabajando en **projectdashboard**, un SaaS multi-tenant construido con:
- Next.js 14 + TypeScript + Tailwind
- Supabase (PostgreSQL + Auth + RLS)
- Stack: `src/` con app router, providers, modules, hooks, core

El proyecto ya tiene:
- Tablas: `tenants`, `profiles`, `customers`, `products`, `sales`, `sale_items`, `services`, `vehicles`, `inventory_items`, `purchase_orders`, `audit_logs`, `tenant_quotas`, `webhook_subscriptions`
- RLS activo con `get_current_user_tenant_id()`
- **Seguridad**: Cumplimiento de [**Prompt Maestro**](file:///e:/ProyectDashboard/docs/PROMPT_MAESTRO_COORDINACION.md) y [**Security Quick Reference**](file:///e:/ProyectDashboard/docs/SECURITY_QUICK_REFERENCE.md).
- Sistema de roles: `SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER`
- Archivos clave: `src/middleware.ts`, `src/core/modules/module-registry.ts`, `src/providers/ModuleContext.tsx`, `src/providers/TenantContext.tsx`

---

## TAREA 1 — Crear y ejecutar migración SQL

Crea el archivo `supabase/migrations/20260312000001_add_locations_modules_billing.sql` con el siguiente contenido EXACTO y ejecútalo en Supabase:

```sql
BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 1: TABLA LOCATIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    address         TEXT,
    city            TEXT,
    country         TEXT DEFAULT 'CO',
    phone           TEXT,
    timezone        TEXT DEFAULT 'America/Bogota',
    opening_hours   JSONB DEFAULT '{}',
    settings        JSONB DEFAULT '{}',
    is_main         BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_locations_tenant ON public.locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON public.locations(tenant_id, is_active) WHERE deleted_at IS NULL;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_tenant_isolation"
ON public.locations FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Auto-crear sede principal para cada tenant existente
INSERT INTO public.locations (tenant_id, name, is_main, is_active)
SELECT id, name || ' — Sede Principal', true, true
FROM public.tenants
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 2: TABLA USER_LOCATIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id     UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'EMPLOYEE'
                    CHECK (role IN ('OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER')),
    can_read_sibling_locations BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    invited_by      UUID REFERENCES auth.users(id),
    invited_at      TIMESTAMPTZ DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,
    UNIQUE(user_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_user_locations_user ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON public.user_locations(location_id);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_locations_own_select"
ON public.user_locations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_locations_admin_select"
ON public.user_locations FOR SELECT
USING (
    location_id IN (
        SELECT ul.location_id FROM public.user_locations ul
        WHERE ul.user_id = auth.uid()
          AND ul.role IN ('OWNER', 'ADMIN')
          AND ul.is_active = true
    )
);

CREATE POLICY "user_locations_admin_insert"
ON public.user_locations FOR INSERT
WITH CHECK (
    location_id IN (
        SELECT ul.location_id FROM public.user_locations ul
        WHERE ul.user_id = auth.uid()
          AND ul.role IN ('OWNER', 'ADMIN')
          AND ul.is_active = true
    )
);

-- Migrar usuarios existentes a su sede principal
INSERT INTO public.user_locations (user_id, location_id, role, is_active, accepted_at)
SELECT
    p.id AS user_id,
    l.id AS location_id,
    CASE p.app_role
        WHEN 'OWNER'    THEN 'OWNER'
        WHEN 'ADMIN'    THEN 'ADMIN'
        WHEN 'EMPLOYEE' THEN 'EMPLOYEE'
        WHEN 'VIEWER'   THEN 'VIEWER'
        ELSE 'EMPLOYEE'
    END AS role,
    true AS is_active,
    NOW() AS accepted_at
FROM public.profiles p
JOIN public.locations l ON l.tenant_id = p.tenant_id AND l.is_main = true
WHERE p.tenant_id IS NOT NULL
  AND p.app_role != 'SUPER_ADMIN'
ON CONFLICT (user_id, location_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 3: HELPERS RLS ACTUALIZADOS
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_location_ids()
RETURNS UUID[] AS $$
    SELECT COALESCE(
        ARRAY_AGG(DISTINCT ul.location_id),
        ARRAY[]::UUID[]
    )
    FROM public.user_locations ul
    WHERE ul.user_id = auth.uid()
      AND ul.is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_sibling_location_ids(p_location_id UUID)
RETURNS UUID[] AS $$
    SELECT COALESCE(
        ARRAY_AGG(DISTINCT l.id),
        ARRAY[]::UUID[]
    )
    FROM public.locations l
    WHERE l.tenant_id = (
        SELECT tenant_id FROM public.locations WHERE id = p_location_id
    )
    AND l.is_active = true
    AND l.deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 4: location_id EN TABLAS OPERATIVAS (nullable, no rompe nada)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.inventory_items
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.purchase_orders
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 5: CATÁLOGO DE MÓDULOS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.modules_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT,
    compatible_types TEXT[],
    is_available    BOOLEAN DEFAULT true,
    version         TEXT DEFAULT '1.0.0',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.modules_catalog (slug, name, description, compatible_types, is_available) VALUES
    ('dashboard',       'Dashboard',          'Panel principal con métricas',           NULL,                                    true),
    ('inventory',       'Inventario',         'Gestión de productos y stock',           NULL,                                    true),
    ('customers',       'Clientes',           'CRM y gestión de clientes',              NULL,                                    true),
    ('sales',           'Ventas',             'Punto de venta y facturación',           NULL,                                    true),
    ('purchases',       'Compras',            'Órdenes de compra a proveedores',        NULL,                                    true),
    ('work_orders',     'Órdenes de Trabajo', 'Gestión de servicios en talleres',       ARRAY['taller'],                         true),
    ('vehicles',        'Vehículos',          'Registro de vehículos por cliente',      ARRAY['taller'],                         true),
    ('reservations',    'Reservas',           'Agenda y reservas',                      ARRAY['restaurante','gym','glamping'],    false),
    ('memberships',     'Membresías',         'Planes y membresías',                    ARRAY['gym'],                             false),
    ('accommodations',  'Alojamientos',       'Cabañas y glamping',                     ARRAY['glamping'],                        false),
    ('tables_events',   'Mesas y Eventos',    'Gestión de mesas y eventos',             ARRAY['restaurante','discoteca'],         false),
    ('reports',         'Reportes',           'Reportes y analytics',                   NULL,                                    false),
    ('settings',        'Configuración',      'Ajustes del sistema',                    NULL,                                    true),
    ('billing',         'Facturación',        'Planes y suscripción',                   NULL,                                    true),
    ('users',           'Usuarios',           'Gestión de usuarios del negocio',        NULL,                                    true)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.modules_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_catalog_read"
ON public.modules_catalog FOR SELECT TO authenticated USING (true);

-- tenant_modules: qué módulos tiene activos cada tenant
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_slug     TEXT NOT NULL REFERENCES public.modules_catalog(slug),
    is_active       BOOLEAN DEFAULT true,
    config          JSONB DEFAULT '{}',
    activated_at    TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    UNIQUE(tenant_id, module_slug)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON public.tenant_modules(tenant_id);

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_modules_isolation"
ON public.tenant_modules FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Migrar active_modules[] a tenant_modules
INSERT INTO public.tenant_modules (tenant_id, module_slug, is_active)
SELECT t.id, LOWER(m_slug), true
FROM public.tenants t, UNNEST(t.active_modules) AS m_slug
WHERE t.active_modules IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.modules_catalog mc WHERE mc.slug = LOWER(m_slug))
ON CONFLICT (tenant_id, module_slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 6: PLANES + SUBSCRIPTIONS + PAYMENTS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT,
    price_monthly   NUMERIC(10,2) DEFAULT 0,
    price_yearly    NUMERIC(10,2) DEFAULT 0,
    currency        TEXT DEFAULT 'COP',
    max_locations   INTEGER DEFAULT 1,
    max_users       INTEGER DEFAULT 3,
    max_customers   INTEGER DEFAULT 50,
    max_inventory   INTEGER DEFAULT 100,
    included_modules TEXT[] DEFAULT ARRAY['dashboard','settings','billing'],
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.plans (slug, name, price_monthly, price_yearly, max_locations, max_users, max_customers, max_inventory, included_modules) VALUES
    ('free',         'Gratuito',    0,       0,       1, 1,  10,  20,   ARRAY['dashboard','inventory','settings','billing']),
    ('starter',      'Starter',     49000,   470000,  1, 3,  100, 200,  ARRAY['dashboard','inventory','customers','sales','settings','billing']),
    ('professional', 'Profesional', 129000,  1240000, 3, 10, 500, 1000, ARRAY['dashboard','inventory','customers','sales','purchases','work_orders','vehicles','users','settings','billing']),
    ('enterprise',   'Empresa',     299000,  2870000, 0, 0,  0,   0,    ARRAY['dashboard','inventory','customers','sales','purchases','work_orders','vehicles','reservations','memberships','reports','users','settings','billing'])
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_slug            TEXT NOT NULL REFERENCES public.plans(slug),
    status               TEXT NOT NULL DEFAULT 'trialing'
                         CHECK (status IN ('trialing','active','past_due','cancelled','suspended')),
    billing_cycle        TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
    trial_ends_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    cancelled_at         TIMESTAMPTZ,
    cancel_reason        TEXT,
    provider             TEXT DEFAULT 'manual' CHECK (provider IN ('mercadopago','stripe','manual')),
    provider_sub_id      TEXT,
    provider_customer_id TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_tenant_isolation"
ON public.subscriptions FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

-- Migrar plan actual de cada tenant a una suscripción
INSERT INTO public.subscriptions (tenant_id, plan_slug, status, billing_cycle)
SELECT id,
    CASE plan
        WHEN 'free'         THEN 'free'
        WHEN 'starter'      THEN 'starter'
        WHEN 'professional' THEN 'professional'
        WHEN 'enterprise'   THEN 'enterprise'
        ELSE 'free'
    END,
    CASE WHEN is_active THEN 'active' ELSE 'suspended' END,
    'monthly'
FROM public.tenants
WHERE is_active = true
ON CONFLICT (tenant_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES public.tenants(id),
    subscription_id     UUID REFERENCES public.subscriptions(id),
    amount              NUMERIC(12,2) NOT NULL,
    currency            TEXT DEFAULT 'COP',
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','failed','refunded')),
    provider            TEXT DEFAULT 'manual',
    provider_payment_id TEXT,
    description         TEXT,
    failure_reason      TEXT,
    paid_at             TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_tenant_isolation"
ON public.payments FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 7: RPC create_location
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_location(
    p_name    TEXT,
    p_address TEXT DEFAULT NULL,
    p_city    TEXT DEFAULT NULL,
    p_phone   TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id   UUID;
    v_location_id UUID;
    v_user_role   TEXT;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuario sin tenant asignado';
    END IF;

    SELECT ul.role INTO v_user_role
    FROM public.user_locations ul
    JOIN public.locations l ON ul.location_id = l.id
    WHERE ul.user_id = auth.uid()
      AND l.tenant_id = v_tenant_id
      AND ul.is_active = true
      AND ul.role IN ('OWNER', 'ADMIN')
    LIMIT 1;

    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'Sin permisos para crear ubicaciones';
    END IF;

    INSERT INTO public.locations (tenant_id, name, address, city, phone, is_main)
    VALUES (v_tenant_id, p_name, p_address, p_city, p_phone, false)
    RETURNING id INTO v_location_id;

    INSERT INTO public.user_locations (user_id, location_id, role, is_active, accepted_at)
    VALUES (auth.uid(), v_location_id, 'ADMIN', true, NOW());

    RETURN v_location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

---

## TAREA 2 — Reemplazar `src/middleware.ts`

Reemplaza el contenido completo del archivo `src/middleware.ts` con esto:

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

const PROTECTED_ROUTES = [
  '/dashboard', '/inventory', '/customers', '/sales',
  '/settings', '/users', '/billing', '/services', '/vehicles'
]
const SUPER_ADMIN_ROUTES = ['/superadmin']
const PUBLIC_ROUTES = [
  '/login', '/auth/login', '/auth/register', '/auth/callback',
  '/auth/reset-password', '/auth/forgot-password',
  '/post-auth', '/register', '/test-public', '/api/v1/public',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = await updateSession(request)

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  if (isPublic) return response

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isSuperAdmin = SUPER_ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (!isProtected && !isSuperAdmin) return response

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isSuperAdmin && user.app_metadata?.app_role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isProtected) {
      const tenantId = user.app_metadata?.tenant_id
      if (!tenantId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single()
        if (!profile?.tenant_id) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }
      }
    }
  } catch (err) {
    console.error('[Middleware] Error:', err)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## TAREA 3 — Reemplazar `src/core/modules/module-registry.ts`

Reemplaza el contenido completo con esto:

```typescript
export type ModuleStatus = 'ACTIVE' | 'INACTIVE' | 'RESTRICTED' | 'DORMANT' | 'ERROR'

export interface ActiveModule {
  key: string
  status: ModuleStatus
  permissions: string[]
  navigation?: { label: string; path: string; icon?: string }[]
}

export const MODULE_DEFINITIONS: Record<string, Omit<ActiveModule, 'status'>> = {
  dashboard:    { key: 'dashboard',    permissions: ['dashboard.view'],                                                                navigation: [{ label: 'Dashboard',          path: '/dashboard'    }] },
  inventory:    { key: 'inventory',    permissions: ['inventory.view','inventory.create','inventory.update','inventory.delete'],        navigation: [{ label: 'Inventario',          path: '/inventory'    }] },
  customers:    { key: 'customers',    permissions: ['customers.view','customers.create','customers.update','customers.delete'],        navigation: [{ label: 'Clientes',            path: '/customers'    }] },
  sales:        { key: 'sales',        permissions: ['sales.view','sales.create','sales.update','sales.cancel'],                        navigation: [{ label: 'Ventas',              path: '/sales'        }] },
  purchases:    { key: 'purchases',    permissions: ['purchases.view','purchases.create','purchases.receive'],                          navigation: [{ label: 'Compras',             path: '/purchases'    }] },
  work_orders:  { key: 'work_orders',  permissions: ['work_orders.view','work_orders.create','work_orders.update','work_orders.close'], navigation: [{ label: 'Órdenes de Trabajo', path: '/services'     }] },
  vehicles:     { key: 'vehicles',     permissions: ['vehicles.view','vehicles.create','vehicles.update'],                             navigation: [{ label: 'Vehículos',           path: '/vehicles'     }] },
  reservations: { key: 'reservations', permissions: ['reservations.view','reservations.create','reservations.cancel'],                 navigation: [{ label: 'Reservas',            path: '/reservations' }] },
  memberships:  { key: 'memberships',  permissions: ['memberships.view','memberships.create','memberships.update'],                    navigation: [{ label: 'Membresías',          path: '/memberships'  }] },
  reports:      { key: 'reports',      permissions: ['reports.view','reports.export'],                                                 navigation: [{ label: 'Reportes',            path: '/reports'      }] },
  billing:      { key: 'billing',      permissions: ['billing.view','billing.manage'],                                                 navigation: [{ label: 'Facturación',         path: '/billing'      }] },
  settings:     { key: 'settings',     permissions: ['settings.view','settings.update'],                                               navigation: [{ label: 'Configuración',       path: '/settings'     }] },
  users:        { key: 'users',        permissions: ['users.view','users.invite','users.manage'],                                      navigation: [{ label: 'Usuarios',            path: '/users'        }] },
}

export function buildActiveModules(activeModuleSlugs: string[]): ActiveModule[] {
  const slugsSet = new Set(activeModuleSlugs.map(s => s.toLowerCase()))
  return Object.values(MODULE_DEFINITIONS).map(def => ({
    ...def,
    status: slugsSet.has(def.key) ? 'ACTIVE' : 'INACTIVE',
  }))
}

export function isModuleActive(key: string, activeModuleSlugs: string[]): boolean {
  return activeModuleSlugs.map(s => s.toLowerCase()).includes(key.toLowerCase())
}

export function getActivePermissions(activeModuleSlugs: string[]): string[] {
  return buildActiveModules(activeModuleSlugs)
    .filter(m => m.status === 'ACTIVE')
    .flatMap(m => m.permissions)
}

// Hooks legacy — mantener por retrocompatibilidad
export function useModules(): ActiveModule[] {
  return buildActiveModules(['dashboard','inventory','customers','sales','settings','billing'])
}
export function useModule(key: string): ActiveModule | undefined {
  return useModules().find(m => m.key === key)
}
```

---

## TAREA 4 — Actualizar `src/providers/ModuleContext.tsx`

El `ModuleProvider` actual usa `localStorage` y tiene todos los módulos activos por defecto (mock). Hay que conectarlo a Supabase.

Reemplaza el contenido completo de `src/providers/ModuleContext.tsx` con esto:

```typescript
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildActiveModules, type ActiveModule } from '@/core/modules/module-registry';
import { useUser } from './AuthContext';

interface ModuleContextValue {
  modules: ActiveModule[];
  activeModuleSlugs: string[];
  isModuleActive: (slug: string) => boolean;
  isLoading: boolean;
  // Legacy support
  toggleModule: (id: string) => void;
  mounted: boolean;
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

export const ModuleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const supabase = createClient();
  const [activeModuleSlugs, setActiveModuleSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadModules = async () => {
      setIsLoading(true);
      try {
        // Leer módulos activos del tenant desde Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile?.tenant_id) {
          setActiveModuleSlugs(['dashboard', 'settings', 'billing']);
          return;
        }

        const { data: tenantModules } = await supabase
          .from('tenant_modules')
          .select('module_slug')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true);

        const slugs = (tenantModules || []).map(m => m.module_slug);
        setActiveModuleSlugs(slugs.length > 0 ? slugs : ['dashboard', 'settings', 'billing']);
      } catch (err) {
        console.error('[ModuleContext] Error loading modules:', err);
        setActiveModuleSlugs(['dashboard', 'settings', 'billing']);
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, [user?.id]);

  const modules = buildActiveModules(activeModuleSlugs);
  const isModuleActive = (slug: string) =>
    activeModuleSlugs.map(s => s.toLowerCase()).includes(slug.toLowerCase());

  return (
    <ModuleContext.Provider value={{
      modules,
      activeModuleSlugs,
      isModuleActive,
      isLoading,
      toggleModule: () => {}, // legacy no-op
      mounted: !isLoading,
    }}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) throw new Error('useModuleContext must be used within ModuleProvider');
  return context;
};
```

---

## TAREA 5 — Crear `src/hooks/useLocation.ts` (archivo nuevo)

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/providers'

export interface Location {
  id: string
  tenant_id: string
  name: string
  address: string | null
  city: string | null
  is_main: boolean
  is_active: boolean
}

export interface UserLocationAccess {
  location: Location
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
  can_read_sibling_locations: boolean
}

const STORAGE_KEY = 'ag_current_location_id'

export function useLocation() {
  const { user } = useUser()
  const supabase = createClient()
  const [locations, setLocations] = useState<UserLocationAccess[]>([])
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('user_locations')
          .select(`role, can_read_sibling_locations, locations(id, tenant_id, name, address, city, is_main, is_active)`)
          .eq('user_id', user.id)
          .eq('is_active', true)

        const mapped: UserLocationAccess[] = (data || [])
          .filter(d => d.locations)
          .map(d => ({
            location: d.locations as Location,
            role: d.role as UserLocationAccess['role'],
            can_read_sibling_locations: d.can_read_sibling_locations ?? false,
          }))

        setLocations(mapped)

        const savedId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
        const saved = mapped.find(l => l.location.id === savedId)
        const main  = mapped.find(l => l.location.is_main)
        setCurrentLocationId(saved?.location.id ?? main?.location.id ?? mapped[0]?.location.id ?? null)
      } catch (err) {
        console.error('[useLocation] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const currentAccess   = locations.find(l => l.location.id === currentLocationId)
  const currentLocation = currentAccess?.location ?? null
  const currentRole     = currentAccess?.role ?? null

  const switchLocation = useCallback((locationId: string) => {
    if (!locations.find(l => l.location.id === locationId)) return
    setCurrentLocationId(locationId)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, locationId)
  }, [locations])

  const canWriteHere = useCallback((resource: string): boolean => {
    if (!currentRole) return false
    if (currentRole === 'OWNER' || currentRole === 'ADMIN') return true
    if (currentRole === 'EMPLOYEE') {
      return ['sales', 'work_orders', 'inventory', 'customers'].includes(resource)
    }
    return false
  }, [currentRole])

  const canReadSiblings = useCallback(
    () => currentAccess?.can_read_sibling_locations ?? false,
    [currentAccess]
  )

  return {
    locations,
    currentLocation,
    currentRole,
    loading,
    switchLocation,
    canWriteHere,
    canReadSiblings,
    isAdmin: currentRole === 'OWNER' || currentRole === 'ADMIN',
  }
}
```

---

## TAREA 6 — Agregar tipos nuevos a `src/lib/supabase/database.types.ts`

Dentro del bloque `Tables: { ... }`, **antes del cierre `}`**, agregar las siguientes tablas: `locations`, `user_locations`, `modules_catalog`, `tenant_modules`, `plans`, `subscriptions`, `payments`.

Los tipos exactos están en el archivo `src/lib/supabase/database.types.new.ts` que ya existe en el proyecto.

---

## ORDEN DE EJECUCIÓN

```
1. Ejecutar migración SQL en Supabase Dashboard → SQL Editor
2. Verificar con: SELECT COUNT(*) FROM locations; -- debe ser >= 1
3. Reemplazar src/middleware.ts
4. Reemplazar src/core/modules/module-registry.ts
5. Reemplazar src/providers/ModuleContext.tsx
6. Crear src/hooks/useLocation.ts
7. Actualizar src/lib/supabase/database.types.ts con los tipos nuevos
8. Ejecutar: npx tsc --noEmit para verificar que no hay errores de tipos
```

## REGLAS IMPORTANTES

- **NO borrar** ninguna tabla existente. Todo es aditivo.
- **NO modificar** RLS existente. Solo agregar nuevas políticas.
- La migración tiene `ON CONFLICT DO NOTHING` en todos los inserts, es segura de re-ejecutar.
- Si `handle_updated_at()` no existe como función trigger, crear así:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;
  ```
- El `useLocation` hook usa `localStorage` solo para recordar la sede activa entre sesiones. No afecta la seguridad (RLS maneja el aislamiento real).

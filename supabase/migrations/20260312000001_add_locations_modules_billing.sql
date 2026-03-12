BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- FUNCIÓN handle_updated_at (si no existe)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_tenant_isolation" ON public.locations;
CREATE POLICY "locations_tenant_isolation"
ON public.locations FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Crear sede principal para cada tenant existente
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

CREATE INDEX IF NOT EXISTS idx_user_locations_user     ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON public.user_locations(location_id);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_locations_own_select"    ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_admin_select"  ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_admin_insert"  ON public.user_locations;

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

-- Migrar usuarios existentes a la sede principal de su tenant
INSERT INTO public.user_locations (user_id, location_id, role, is_active, accepted_at)
SELECT
    p.id,
    l.id,
    CASE p.app_role
        WHEN 'OWNER'    THEN 'OWNER'
        WHEN 'ADMIN'    THEN 'ADMIN'
        WHEN 'EMPLOYEE' THEN 'EMPLOYEE'
        WHEN 'VIEWER'   THEN 'VIEWER'
        ELSE 'EMPLOYEE'
    END,
    true,
    NOW()
FROM public.profiles p
JOIN public.locations l ON l.tenant_id = p.tenant_id AND l.is_main = true
WHERE p.tenant_id IS NOT NULL
  AND p.app_role != 'SUPER_ADMIN'
ON CONFLICT (user_id, location_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 3: HELPERS RLS
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_location_ids()
RETURNS UUID[] AS $$
    SELECT COALESCE(ARRAY_AGG(DISTINCT ul.location_id), ARRAY[]::UUID[])
    FROM public.user_locations ul
    WHERE ul.user_id = auth.uid() AND ul.is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_sibling_location_ids(p_location_id UUID)
RETURNS UUID[] AS $$
    SELECT COALESCE(ARRAY_AGG(DISTINCT l.id), ARRAY[]::UUID[])
    FROM public.locations l
    WHERE l.tenant_id = (SELECT tenant_id FROM public.locations WHERE id = p_location_id)
      AND l.is_active = true
      AND l.deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 4: location_id EN TABLAS OPERATIVAS
-- Nombres reales según el schema actual
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.inventory_items    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.sales              ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.service_orders     ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.purchase_orders    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.customers          ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.products           ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.vehicles           ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 5: CATÁLOGO DE MÓDULOS
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.modules_catalog (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             TEXT NOT NULL UNIQUE,
    name             TEXT NOT NULL,
    description      TEXT,
    compatible_types TEXT[],
    is_available     BOOLEAN DEFAULT true,
    version          TEXT DEFAULT '1.0.0',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.modules_catalog (slug, name, description, compatible_types, is_available) VALUES
    ('dashboard',      'Dashboard',          'Panel principal con métricas',           NULL,                                  true),
    ('inventory',      'Inventario',         'Gestión de productos y stock',           NULL,                                  true),
    ('customers',      'Clientes',           'CRM y gestión de clientes',              NULL,                                  true),
    ('sales',          'Ventas',             'Punto de venta y facturación',           NULL,                                  true),
    ('purchases',      'Compras',            'Órdenes de purchase_orders',             NULL,                                  true),
    ('work_orders',    'Órdenes de Trabajo', 'Gestión de servicios en talleres',       ARRAY['taller'],                       true),
    ('vehicles',       'Vehículos',          'Registro de vehículos por cliente',      ARRAY['taller'],                       true),
    ('reservations',   'Reservas',           'Agenda y reservas',                      ARRAY['restaurante','gym','glamping'], false),
    ('memberships',    'Membresías',         'Planes y membresías',                    ARRAY['gym'],                          false),
    ('accommodations', 'Alojamientos',       'Cabañas y glamping',                     ARRAY['glamping'],                     false),
    ('tables_events',  'Mesas y Eventos',    'Gestión de mesas y eventos',             ARRAY['restaurante','discoteca'],      false),
    ('reports',        'Reportes',           'Reportes y analytics',                   NULL,                                  false),
    ('settings',       'Configuración',      'Ajustes del sistema',                    NULL,                                  true),
    ('billing',        'Facturación',        'Planes y suscripción',                   NULL,                                  true),
    ('users',          'Usuarios',           'Gestión de usuarios del negocio',        NULL,                                  true)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.modules_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "modules_catalog_read" ON public.modules_catalog;
CREATE POLICY "modules_catalog_read"
ON public.modules_catalog FOR SELECT TO authenticated USING (true);

-- tenant_modules
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_slug  TEXT NOT NULL REFERENCES public.modules_catalog(slug),
    is_active    BOOLEAN DEFAULT true,
    config       JSONB DEFAULT '{}',
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at   TIMESTAMPTZ,
    UNIQUE(tenant_id, module_slug)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON public.tenant_modules(tenant_id);

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_modules_isolation" ON public.tenant_modules;
CREATE POLICY "tenant_modules_isolation"
ON public.tenant_modules FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Migrar active_modules[] existentes
INSERT INTO public.tenant_modules (tenant_id, module_slug, is_active)
SELECT t.id, LOWER(m_slug), true
FROM public.tenants t, UNNEST(t.active_modules) AS m_slug
WHERE t.active_modules IS NOT NULL
  AND array_length(t.active_modules, 1) > 0
  AND EXISTS (
      SELECT 1 FROM public.modules_catalog mc WHERE mc.slug = LOWER(m_slug)
  )
ON CONFLICT (tenant_id, module_slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- PARTE 6: PLANES + SUBSCRIPTIONS + PAYMENTS
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.plans (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             TEXT NOT NULL UNIQUE,
    name             TEXT NOT NULL,
    description      TEXT,
    price_monthly    NUMERIC(10,2) DEFAULT 0,
    price_yearly     NUMERIC(10,2) DEFAULT 0,
    currency         TEXT DEFAULT 'COP',
    max_locations    INTEGER DEFAULT 1,
    max_users        INTEGER DEFAULT 3,
    max_customers    INTEGER DEFAULT 50,
    max_inventory    INTEGER DEFAULT 100,
    included_modules TEXT[] DEFAULT ARRAY['dashboard','settings','billing'],
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.plans (slug, name, price_monthly, price_yearly, max_locations, max_users, max_customers, max_inventory, included_modules) VALUES
    ('free',         'Gratuito',    0,      0,       1, 1,  10,  20,   ARRAY['dashboard','inventory','settings','billing']),
    ('starter',      'Starter',     49000,  470000,  1, 3,  100, 200,  ARRAY['dashboard','inventory','customers','sales','settings','billing']),
    ('professional', 'Profesional', 129000, 1240000, 3, 10, 500, 1000, ARRAY['dashboard','inventory','customers','sales','purchases','work_orders','vehicles','users','settings','billing']),
    ('enterprise',   'Empresa',     299000, 2870000, 0, 0,  0,   0,    ARRAY['dashboard','inventory','customers','sales','purchases','work_orders','vehicles','reservations','memberships','reports','users','settings','billing'])
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_public_read" ON public.plans;
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
DROP POLICY IF EXISTS "subscriptions_tenant_isolation" ON public.subscriptions;
CREATE POLICY "subscriptions_tenant_isolation"
ON public.subscriptions FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

-- Migrar plan actual de cada tenant a subscriptions
INSERT INTO public.subscriptions (tenant_id, plan_slug, status, billing_cycle)
SELECT
    id,
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
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payments;
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

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════
SELECT 'locations'      AS tabla, COUNT(*) AS filas FROM public.locations
UNION ALL
SELECT 'user_locations',                COUNT(*) FROM public.user_locations
UNION ALL
SELECT 'modules_catalog',               COUNT(*) FROM public.modules_catalog
UNION ALL
SELECT 'tenant_modules',                COUNT(*) FROM public.tenant_modules
UNION ALL
SELECT 'plans',                         COUNT(*) FROM public.plans
UNION ALL
SELECT 'subscriptions',                 COUNT(*) FROM public.subscriptions;

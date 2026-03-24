-- ============================================================
-- Fase 2: Normalización Arrays (P1)
-- ============================================================
-- Propósito: Eliminar campos array tipo string por tablas de relación
-- Tablas Afectadas: plan_modules (nueva), tenant_modules
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: Creación de tabla plan_modules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plan_modules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_slug text NOT NULL REFERENCES public.plans(slug) ON DELETE CASCADE,
    module_slug text NOT NULL REFERENCES public.modules_catalog(slug) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(plan_slug, module_slug)
);

-- Habilitar RLS
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;

-- Politicas para plan_modules
-- Permitimos lectura a todo el mundo (roles autenticados usualmente) ya que la lista de planes es pública.
CREATE POLICY "Public read access for active plan modules"
ON public.plan_modules FOR SELECT
USING (is_active = true);

-- ============================================================
-- PASO 2: Poblado de plan_modules
-- ============================================================
INSERT INTO public.plan_modules (plan_slug, module_slug)
SELECT p.slug, lower(unnest(p.included_modules))
FROM public.plans p
WHERE array_length(p.included_modules, 1) > 0
ON CONFLICT (plan_slug, module_slug) DO NOTHING;

-- ============================================================
-- PASO 3: Poblado de tenant_modules (migrar datos de tenants.active_modules)
-- ============================================================
-- Esto moverá los modulos instalados actualmente en tenant a tenant_modules intermedio.
INSERT INTO public.tenant_modules (tenant_id, module_slug)
SELECT t.id, lower(unnest(t.active_modules))
FROM public.tenants t
WHERE array_length(t.active_modules, 1) > 0
ON CONFLICT (tenant_id, module_slug) DO NOTHING;

COMMIT;

-- ============================================================
-- Fase 4: Dominio (Extracción de literales / Enums hardcodeados)
-- ============================================================
-- Propósito: Desacoplar reglas de negocio hardcodeadas de las 
-- restricciones CHECK hacia tablas maestras.
-- ============================================================

BEGIN;

-- 1. Crear Tabla de Dominio
CREATE TABLE IF NOT EXISTS public.industries (
    slug text PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Asegurar que el trigger de updated_at para industries exista (Fase 3 lo creó)
DROP TRIGGER IF EXISTS set_updated_at ON public.industries;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.industries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Lectura universal para catálogos
DROP POLICY IF EXISTS "Catálogo de industrias es de lectura pública" ON public.industries;
CREATE POLICY "Catálogo de industrias es de lectura pública"
ON public.industries FOR SELECT
USING (true);

-- Poblar valores base extrapolados de Constraint original
INSERT INTO public.industries (slug, name) VALUES 
('taller', 'Taller Mecánico / Automotriz'),
('restaurante', 'Restaurante / Gastronomía'),
('supermercado', 'Supermercado / Retail'),
('ferreteria', 'Ferretería / Construcción'),
('gym', 'Gimnasio / Centro Fitness'),
('glamping', 'Glamping / Hotelería'),
('discoteca', 'Bar / Discoteca / Entretenimiento')
ON CONFLICT (slug) DO NOTHING;

-- 2. Eliminar Constraints CHECK rígidos (Strings hardcodeados)
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_industry_type_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_industry_type_check;

-- 3. Añadir Relaciones Sólidas
ALTER TABLE public.tenants 
  ADD CONSTRAINT tenants_plan_fkey 
  FOREIGN KEY (plan) REFERENCES public.plans(slug) ON DELETE RESTRICT;

ALTER TABLE public.tenants 
  ADD CONSTRAINT tenants_industry_type_fkey 
  FOREIGN KEY (industry_type) REFERENCES public.industries(slug) ON DELETE RESTRICT;

ALTER TABLE public.products 
  ADD CONSTRAINT products_industry_type_fkey 
  FOREIGN KEY (industry_type) REFERENCES public.industries(slug) ON DELETE RESTRICT;

COMMIT;

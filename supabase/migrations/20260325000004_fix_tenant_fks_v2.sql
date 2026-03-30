-- ============================================================
-- Migración: 20260325000004_fix_tenant_fks_v2.sql
-- Propósito: Eliminar FK compuesta de specialities y crear una independiente.
-- ============================================================

BEGIN;

-- 0. Garantizar que slug en industry_specialties sea único (requerido para la FK)
ALTER TABLE public.industry_specialties
  DROP CONSTRAINT IF EXISTS industry_specialties_slug_key;
ALTER TABLE public.industry_specialties
  ADD CONSTRAINT industry_specialties_slug_key UNIQUE (slug);

-- 1. Eliminar la FK compuesta incorrecta
ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS fk_tenant_specialty_1;

-- 2. Crear FK correcta e independiente para specialty_slug
ALTER TABLE public.tenants
  ADD CONSTRAINT fk_tenant_specialty_slug
  FOREIGN KEY (specialty_slug)
  REFERENCES public.industry_specialties(slug)
  ON DELETE SET NULL;

COMMIT;

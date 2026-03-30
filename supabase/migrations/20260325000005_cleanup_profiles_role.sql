-- ============================================================
-- Migración: 20260325000005_cleanup_profiles_role.sql
-- Propósito: Estandarizar todos los roles en 'profiles' a MAYÚSCULAS y aplicar constraint.
-- ============================================================

BEGIN;

-- Actualizar a mayúsculas todo rol divergente
UPDATE public.profiles 
SET app_role = UPPER(app_role) 
WHERE app_role != UPPER(app_role) OR app_role IS NULL;
-- En migraciones anteriores se renombró 'role' a 'app_role' 

-- Descartar cualquier validación antigua si existiese
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_app_role_check;

-- Aplicar la restricción rígida de AppRole
ALTER TABLE public.profiles ADD CONSTRAINT profiles_app_role_check
  CHECK (app_role IN ('OWNER','ADMIN','EMPLOYEE','VIEWER','SUPER_ADMIN'));

COMMIT;

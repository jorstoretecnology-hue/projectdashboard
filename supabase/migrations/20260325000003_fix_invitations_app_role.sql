-- ============================================================
-- Migración: 20260325000003_fix_invitations_app_role.sql
-- Propósito: Actualizar el check constraint de app_role en `invitations`
-- para coincidir con la enumeración (OWNER, ADMIN, EMPLOYEE, VIEWER).
-- ============================================================

BEGIN;

DO $$
DECLARE
    con_name text;
BEGIN
    -- Encuentra el constraint CHECK asociado a app_role
    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'public.invitations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%app_role = ANY%';

    IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.invitations DROP CONSTRAINT %I', con_name);
    END IF;

    ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_app_role_check;
END $$;

-- Actualizar filas existentes a la nueva nomenclatura SIN restricciones activas
UPDATE public.invitations SET app_role = 'ADMIN' WHERE app_role = 'admin';
UPDATE public.invitations SET app_role = 'EMPLOYEE' WHERE app_role = 'staff';
UPDATE public.invitations SET app_role = 'VIEWER' WHERE app_role = 'user';

-- Crear el constraint con los valores válidos actuales
ALTER TABLE public.invitations ADD CONSTRAINT invitations_app_role_check 
CHECK (app_role IN ('OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));

COMMIT;

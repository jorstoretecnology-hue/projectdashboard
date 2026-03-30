-- ============================================================
-- Migración: 20260325000001_fix_tenant_specialty_fks.sql
-- Propósito: Renombrar los constraints duplicados `fk_tenant_specialty` en `tenants`
-- ============================================================

BEGIN;

DO $$
DECLARE
    r RECORD;
    i INT := 1;
BEGIN
    -- Busca todos los constraints con el nombre fk_tenant_specialty en la tabla tenants
    FOR r IN
        SELECT conname, oid
        FROM pg_constraint
        WHERE conrelid = 'public.tenants'::regclass AND conname = 'fk_tenant_specialty'
    LOOP
        -- Renombrar asignando un sufijo único incremental
        EXECUTE format('ALTER TABLE public.tenants RENAME CONSTRAINT %I TO fk_tenant_specialty_%s', r.conname, i);
        i := i + 1;
    END LOOP;
END $$;

COMMIT;

-- ============================================================
-- Migración: 20260325000002_fix_products_sku_unique.sql
-- Propósito: Eliminar el constraint UNIQUE global de `sku` en `products` 
-- y reemplazarlo por uno compuesto UNIQUE(tenant_id, sku)
-- ============================================================

BEGIN;

DO $$
DECLARE
    con_name text;
BEGIN
    -- Encontrar el nombre del constraint UNIQUE que solo aplica a la columna `sku`
    SELECT tc.constraint_name INTO con_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'products' 
      AND tc.constraint_type = 'UNIQUE'
      AND EXISTS (
          SELECT 1 FROM information_schema.key_column_usage kcu
          WHERE kcu.table_name = 'products' 
            AND kcu.constraint_name = tc.constraint_name 
            AND kcu.column_name = 'sku'
      )
      AND (
          SELECT count(*) FROM information_schema.key_column_usage kcu
          WHERE kcu.table_name = 'products' 
            AND kcu.constraint_name = tc.constraint_name
      ) = 1;

    -- Si se encontró, eliminar el constraint global
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT ' || quote_ident(con_name);
    END IF;
    
    -- Agregamos el constraint correcto compuesto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' AND constraint_name = 'products_tenant_id_sku_key'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_sku_key UNIQUE (tenant_id, sku);
    END IF;
END $$;

COMMIT;

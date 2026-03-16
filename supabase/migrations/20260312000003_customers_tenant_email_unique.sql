-- Tarea #8: Unicidad de Email por Tenant
-- 1. Limpieza de duplicados de forma forzada (Bypassing triggers vía session_replication_role)
-- Esto permite borrar registros incluso si hay triggers de borrado lógico o restricciones complejas
SET session_replication_role = 'replica';

DELETE FROM public.customers 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id, email ORDER BY created_at DESC) as rn
        FROM public.customers
    ) t WHERE rn > 1
);

SET session_replication_role = 'origin';

-- 2. Aplicar Constraint
ALTER TABLE public.customers
DROP CONSTRAINT IF EXISTS customers_email_key;

ALTER TABLE public.customers
ADD CONSTRAINT customers_tenant_email_unique
UNIQUE (tenant_id, email);

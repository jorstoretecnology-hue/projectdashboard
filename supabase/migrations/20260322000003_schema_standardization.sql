-- ============================================================
-- Migración: 20260322000003_schema_standardization.sql
-- Propósito: Estandarización de Dominios y Nomenclatura FK
-- Corregido: Manejo de dependencias de vistas (view_saas_health)
-- ============================================================

BEGIN;

-- 0. ELIMINAR VISTAS DEPENDIENTES TEMPORALMENTE
DROP VIEW IF EXISTS public.view_saas_health;

-- 1. CREACIÓN DE DOMINIOS (Tipos de datos consistentes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'industry_type_domain') THEN
        CREATE DOMAIN industry_type_domain AS VARCHAR(50)
        CHECK (VALUE IN ('taller', 'restaurante', 'supermercado', 'ferreteria', 'gym', 'glamping', 'discoteca'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type_domain') THEN
        CREATE DOMAIN plan_type_domain AS VARCHAR(50)
        CHECK (VALUE IN ('free', 'starter', 'professional', 'enterprise'));
    END IF;
END $$;

-- 2. APLICAR DOMINIOS A TABLAS EXISTENTES
ALTER TABLE products ALTER COLUMN industry_type TYPE industry_type_domain;
ALTER TABLE tenants ALTER COLUMN industry_type TYPE industry_type_domain;
ALTER TABLE tenants ALTER COLUMN plan TYPE plan_type_domain;

-- 3. RECREAR VISTAS DEPENDIENTES
CREATE OR REPLACE VIEW public.view_saas_health AS
SELECT 
    t.name AS tenant_name,
    t.plan,
    count(a.id) FILTER (WHERE a.action = 'QUOTA_EXCEEDED') AS quota_alerts,
    MAX(a.created_at) AS last_activity
FROM public.tenants t
LEFT JOIN public.audit_logs a ON t.id = a.tenant_id
GROUP BY t.id, t.name, t.plan;

-- Restaurar security_invoker
ALTER VIEW public.view_saas_health SET (security_invoker = on);

-- 4. ESTANDARIZACIÓN DE FOREIGN KEYS
CREATE OR REPLACE FUNCTION rename_constraint_if_exists(t_name text, old_name text, new_name text) 
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = old_name AND table_name = t_name) THEN
        EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', t_name, old_name, new_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT rename_constraint_if_exists('products', 'products_tenant_id_fkey', 'fk_products_tenant');
SELECT rename_constraint_if_exists('sales', 'sales_tenant_id_fkey', 'fk_sales_tenant');
SELECT rename_constraint_if_exists('sales', 'sales_customer_id_fkey', 'fk_sales_customer');
SELECT rename_constraint_if_exists('inventory_movements', 'inventory_movements_tenant_id_fkey', 'fk_inv_movements_tenant');
SELECT rename_constraint_if_exists('inventory_movements', 'inventory_movements_product_id_fkey', 'fk_inv_movements_product');

COMMIT;

-- =============================================================================
-- Migración: 20260304000000_security_audit_remediation.sql
-- Descripción: Corrección de integridad referencial y aislamiento multi-tenant
-- Resultado de Auditoría: SECURITY_AUDIT_REPORT.md
-- =============================================================================

BEGIN;

-- 1. CORRECCIÓN DE INTEGRIDAD REFERENCIAL
-- Añadimos las FKs faltantes con borrado en cascada para cumplimiento de GDPR/Privacidad
-- Nota: Usamos DO blocks para prevenir errores si la FK ya existe

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_tenant_id_fkey') THEN
        ALTER TABLE products 
          ADD CONSTRAINT products_tenant_id_fkey 
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customers_tenant_id_fkey') THEN
        ALTER TABLE customers 
          ADD CONSTRAINT customers_tenant_id_fkey 
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'inventory_items_tenant_id_fkey') THEN
        ALTER TABLE inventory_items 
          ADD CONSTRAINT inventory_items_tenant_id_fkey 
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 2. CORRECCIÓN DE POLÍTICAS RLS (UNIFICACIÓN)
-- Aseguramos que todas las tablas usen el helper get_current_user_tenant_id() para evitar IDOR

-- CORRECCIÓN PARA CUSTOMERS
DROP POLICY IF EXISTS "Customers Isolation Policy (Select)" ON customers;
DROP POLICY IF EXISTS "Customers Isolation Policy (Insert)" ON customers;
DROP POLICY IF EXISTS "customers_isolation_all" ON customers;
CREATE POLICY "customers_isolation_all" ON customers
    FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- CORRECCIÓN PARA INVENTORY_ITEMS
DROP POLICY IF EXISTS "Inventory Select Policy" ON inventory_items;
DROP POLICY IF EXISTS "Inventory Insert Policy" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_isolation_all" ON inventory_items;
CREATE POLICY "inventory_items_isolation_all" ON inventory_items
    FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- CORRECCIÓN PARA SALES (Concepto SAC de aislamiento por Tenant, no por Usuario personal)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sales') THEN
        DROP POLICY IF EXISTS sales_tenant_isolation ON sales;
        CREATE POLICY sales_tenant_isolation ON sales
            FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;
END $$;


-- 3. UNICIDAD DE SKU POR TENANT
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'inventory_items_tenant_sku_unique') THEN
        ALTER TABLE inventory_items 
          ADD CONSTRAINT inventory_items_tenant_sku_unique UNIQUE (tenant_id, sku);
    END IF;
END $$;


-- 4. HARDENING DE FUNCIONES HELPERS (Search Path Fix)
ALTER FUNCTION get_current_user_tenant_id() SET search_path = public;
ALTER FUNCTION is_super_admin(uuid) SET search_path = public;

COMMIT;

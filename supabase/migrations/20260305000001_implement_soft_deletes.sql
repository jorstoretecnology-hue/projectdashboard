-- =============================================================================
-- Migración: 20260305000001_implement_soft_deletes.sql
-- Descripción: Implementación de Borrado Lógico (Soft Deletes)
-- =============================================================================

BEGIN;

-- 1. CREACIÓN DE LA FUNCIÓN DE DISPARO (TRIGGER)
-- Esta función convierte cualquier DELETE físico en un UPDATE lógico.
CREATE OR REPLACE FUNCTION public.handle_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    EXECUTE format('UPDATE %I.%I SET deleted_at = NOW() WHERE id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    USING OLD.id;
    RETURN NULL; -- Cancela el borrado físico
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADICIÓN DE COLUMNA Y TRIGGER A TABLAS NÚCLEO
DO $$ 
DECLARE 
    t text;
    tables_to_update text[] := ARRAY[
        'inventory_items', 
        'customers', 
        'products', 
        'profiles', 
        'sales', 
        'sale_items', 
        'purchase_orders', 
        'purchase_order_items', 
        'vehicles', 
        'services'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_update LOOP
        -- Verificar si la tabla existe en el esquema público
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t AND schemaname = 'public') THEN
            -- Agregar columna si no existe
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = t AND column_name = 'deleted_at') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL', t);
            END IF;

            -- Agregar Trigger (Borrado lógico)
            EXECUTE format('DROP TRIGGER IF EXISTS tr_soft_delete_%I ON %I', t, t);
            EXECUTE format('CREATE TRIGGER tr_soft_delete_%I BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION handle_soft_delete()', t, t);
        END IF;
    END LOOP;
END $$;

-- 3. REFACTORIZACIÓN DE POLÍTICAS RLS (DEFENSIVO)
-- Unificamos las políticas para incluir la condición deleted_at IS NULL solo si la tabla existe

-- CUSTOMERS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customers') THEN
        DROP POLICY IF EXISTS "customers_isolation_all" ON customers;
        CREATE POLICY "customers_isolation_all" ON customers
            FOR ALL USING (tenant_id = get_current_user_tenant_id() AND deleted_at IS NULL);
    END IF;
END $$;

-- INVENTORY_ITEMS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inventory_items') THEN
        DROP POLICY IF EXISTS "inventory_items_isolation_all" ON inventory_items;
        CREATE POLICY "inventory_items_isolation_all" ON inventory_items
            FOR ALL USING (tenant_id = get_current_user_tenant_id() AND deleted_at IS NULL);
    END IF;
END $$;

-- PRODUCTS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products') THEN
        DROP POLICY IF EXISTS "products_isolation_all" ON products;
        CREATE POLICY "products_isolation_all" ON products
            FOR ALL USING (tenant_id = get_current_user_tenant_id() AND deleted_at IS NULL);
    END IF;
END $$;

-- SALES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sales') THEN
        DROP POLICY IF EXISTS sales_tenant_isolation ON sales;
        CREATE POLICY sales_tenant_isolation ON sales
            FOR ALL USING (tenant_id = get_current_user_tenant_id() AND deleted_at IS NULL);
    END IF;
END $$;

-- VEHICLES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vehicles') THEN
        DROP POLICY IF EXISTS vehicles_isolation ON vehicles;
        CREATE POLICY vehicles_isolation ON vehicles
            FOR ALL USING (tenant_id = get_current_user_tenant_id() AND deleted_at IS NULL);
    END IF;
END $$;

-- SERVICES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'services') THEN
        DROP POLICY IF EXISTS services_isolation ON services;
        CREATE POLICY services_isolation ON services
            FOR ALL USING (tenant_id = get_current_user_tenant_id() AND deleted_at IS NULL);
    END IF;
END $$;

-- PURCHASE_ORDERS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'purchase_orders') THEN
        DROP POLICY IF EXISTS purchase_orders_isolation ON purchase_orders;
        CREATE POLICY purchase_orders_isolation ON purchase_orders
            FOR ALL USING (tenant_id = get_current_user_tenant_id() AND deleted_at IS NULL);
    END IF;
END $$;

-- 4. FUNCIÓN DE RESTAURACIÓN (SECURITY DEFINER)
-- Permite restaurar registros sorteando el RLS si es necesario (vía RPC)
CREATE OR REPLACE FUNCTION public.restore_record(target_table text, record_id uuid, target_tenant_id uuid)
RETURNS void AS $$
BEGIN
    -- Validamos que el usuario que llama tenga el mismo tenant_id que el registro (Seguridad aplicada manualmente)
    EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1 AND tenant_id = $2', target_table)
    USING record_id, target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

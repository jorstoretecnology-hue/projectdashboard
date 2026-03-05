-- -----------------------------------------------------------------------------
-- FASE 1: CONSOLIDACIÓN DE MÓDULOS Y MOTOR DE CUOTAS DB-LEVEL
-- -----------------------------------------------------------------------------

-- 1. Tabla: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT, -- Compatibilidad con verificación rápida
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers Isolation" ON public.customers;
CREATE POLICY "Customers Isolation" ON public.customers
FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');

-- 2. Tabla: inventory_items
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Inventory
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inventory Isolation" ON public.inventory_items;
CREATE POLICY "Inventory Isolation" ON public.inventory_items
FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');

-- 3. Tabla: tenant_quotas (Extendido para soporte de límites en DB)
CREATE TABLE IF NOT EXISTS public.tenant_quotas (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    resource_key TEXT NOT NULL, -- 'maxInventoryItems', 'maxCustomers', 'maxUsers'
    current_usage INTEGER NOT NULL DEFAULT 0,
    max_limit INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, resource_key)
);

-- RLS Quotas
ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quotas View Access" ON public.tenant_quotas;
CREATE POLICY "Quotas View Access" ON public.tenant_quotas
FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');

-- 4. FUNCIÓN: Validar y Bloquear por Cuota (Source of Truth)
CREATE OR REPLACE FUNCTION public.validate_quota_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_resource_key TEXT;
    v_current_usage INTEGER;
    v_max_limit INTEGER;
BEGIN
    -- Determinar el recurso basado en la tabla
    IF TG_TABLE_NAME = 'inventory_items' THEN v_resource_key := 'maxInventoryItems';
    ELSIF TG_TABLE_NAME = 'customers' THEN v_resource_key := 'maxCustomers';
    ELSE RETURN NEW;
    END IF;

    -- Obtener estado actual de la quota
    SELECT current_usage, max_limit INTO v_current_usage, v_max_limit
    FROM public.tenant_quotas
    WHERE tenant_id = NEW.tenant_id AND resource_key = v_resource_key;

    -- Si no existe la fila de quota, asumimos que no hay límite aún (o se creará por el app)
    -- Pero para seguridad real, si existe y el uso >= limite, BLOQUEAR.
    IF v_max_limit > 0 AND v_current_usage >= v_max_limit THEN
        RAISE EXCEPTION 'QUOTA_EXCEEDED: El limite de % (%) ha sido alcanzado.', v_resource_key, v_max_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers de Bloqueo
DROP TRIGGER IF EXISTS tr_check_inventory_quota ON public.inventory_items;
CREATE TRIGGER tr_check_inventory_quota
BEFORE INSERT ON public.inventory_items
FOR EACH ROW EXECUTE PROCEDURE public.validate_quota_on_insert();

DROP TRIGGER IF EXISTS tr_check_customer_quota ON public.customers;
CREATE TRIGGER tr_check_customer_quota
BEFORE INSERT ON public.customers
FOR EACH ROW EXECUTE PROCEDURE public.validate_quota_on_insert();

-- 6. Incrementar Automático (Sync Quota Usage)
CREATE OR REPLACE FUNCTION public.sync_quota_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.tenant_quotas (tenant_id, resource_key, current_usage)
        VALUES (
            NEW.tenant_id, 
            CASE 
                WHEN TG_TABLE_NAME = 'inventory_items' THEN 'maxInventoryItems'
                WHEN TG_TABLE_NAME = 'customers' THEN 'maxCustomers'
            END, 
            1
        )
        ON CONFLICT (tenant_id, resource_key) 
        DO UPDATE SET current_usage = public.tenant_quotas.current_usage + 1, updated_at = NOW();
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.tenant_quotas 
        SET current_usage = GREATEST(0, current_usage - 1), updated_at = NOW()
        WHERE tenant_id = OLD.tenant_id AND resource_key = 
            CASE 
                WHEN TG_TABLE_NAME = 'inventory_items' THEN 'maxInventoryItems'
                WHEN TG_TABLE_NAME = 'customers' THEN 'maxCustomers'
            END;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers de Sync
DROP TRIGGER IF EXISTS tr_sync_inventory_usage ON public.inventory_items;
CREATE TRIGGER tr_sync_inventory_usage
AFTER INSERT OR DELETE ON public.inventory_items
FOR EACH ROW EXECUTE PROCEDURE public.sync_quota_usage();

DROP TRIGGER IF EXISTS tr_sync_customer_usage ON public.customers;
CREATE TRIGGER tr_sync_customer_usage
AFTER INSERT OR DELETE ON public.customers
FOR EACH ROW EXECUTE PROCEDURE public.sync_quota_usage();

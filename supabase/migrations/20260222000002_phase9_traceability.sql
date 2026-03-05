-- =============================================================================
-- Migración 20260222000002: Trazabilidad Temporal (State History) - REVISADA
-- =============================================================================

-- 0. ASEGURAR COLUMNA 'state' EN SERVICE_ORDERS (Defensivo)
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
    -- Si la tabla service_orders existe pero no tiene la columna state, la agregamos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_orders' AND column_name = 'state') THEN
            ALTER TABLE public.service_orders ADD COLUMN state VARCHAR(50) NOT NULL DEFAULT 'RECIBIDO';
        END IF;
    END IF;
END $$;

-- 1. TABLA STATE_HISTORY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    entity_type VARCHAR(50) NOT NULL, -- 'sale', 'service_order', 'product'
    entity_id UUID NOT NULL,
    
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Métricas de tiempo
    duration_minutes INTEGER,
    
    -- Metadata adicional (razón, etc.)
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_state_history_entity ON state_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_state_history_tenant ON state_history(tenant_id, changed_at DESC);

-- 2. RLS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'state_history' AND rowsecurity = true) THEN
        ALTER TABLE public.state_history ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DROP POLICY IF EXISTS "state_history_select" ON public.state_history;
CREATE POLICY "state_history_select" ON public.state_history
    FOR SELECT USING (tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin());

-- 3. FUNCIÓN TRIGGER: track_state_history()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_state_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo insertar si el estado cambió
    -- Usamos COALESCE para manejar el primer estado (from_state NULL)
    IF (TG_OP = 'INSERT') OR (NEW.state IS DISTINCT FROM OLD.state) THEN
        INSERT INTO public.state_history (
            tenant_id,
            entity_type,
            entity_id,
            from_state,
            to_state,
            changed_by,
            duration_minutes,
            metadata
        ) VALUES (
            NEW.tenant_id,
            TG_TABLE_NAME,
            NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.state ELSE NULL END,
            NEW.state,
            auth.uid(),
            CASE 
                WHEN TG_OP = 'UPDATE' THEN 
                    EXTRACT(EPOCH FROM (NOW() - (
                        SELECT changed_at 
                        FROM public.state_history 
                        WHERE entity_id = NEW.id 
                          AND tenant_id = NEW.tenant_id 
                        ORDER BY changed_at DESC 
                        LIMIT 1
                    ))) / 60
                ELSE NULL 
            END,
            jsonb_build_object(
                'op', TG_OP,
                'timestamp', NOW()
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. APLICAR TRIGGERS
-- -----------------------------------------------------------------------------

-- Venta
DROP TRIGGER IF EXISTS trg_sales_state_history ON public.sales;
CREATE TRIGGER trg_sales_state_history
    AFTER INSERT OR UPDATE OF state ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.track_state_history();

-- Órdenes de Servicio
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_orders' AND column_name = 'state') THEN
        DROP TRIGGER IF EXISTS trg_service_orders_state_history ON public.service_orders;
        CREATE TRIGGER trg_service_orders_state_history
            AFTER INSERT OR UPDATE OF state ON public.service_orders
            FOR EACH ROW EXECUTE FUNCTION public.track_state_history();
    END IF;
END $$;

-- Productos
DROP TRIGGER IF EXISTS trg_products_state_history ON public.products;
CREATE TRIGGER trg_products_state_history
    AFTER INSERT OR UPDATE OF state ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.track_state_history();

-- Comentarios
COMMENT ON TABLE public.state_history IS 'Historial analítico de cambios de estado para KPI de Lead Time';

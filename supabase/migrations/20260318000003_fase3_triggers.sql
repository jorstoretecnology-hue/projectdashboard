-- ============================================================
-- Fase 3: Triggers Automáticos (updated_at)
-- ============================================================
-- Propósito: Mantener la consistencia de la columna updated_at
-- ============================================================

BEGIN;

-- 1. Asegurar que existe la función genérica
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicar triggers dinámicamente en las tablas identificadas
DO $$
DECLARE
    t_name text;
    -- Lista de tablas que actualmente no poseen trigger activo según catálogo pg_trigger
    tables text[] := ARRAY[
        'webhook_subscriptions', 'vehicles', 'notification_templates', 
        'profiles', 'inventory_items', 'tenant_quotas', 
        'customers', 'security_groups', 'locations', 
        'sales', 'subscriptions'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables LOOP
        -- Borrar el trigger previo de forma segura
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I;', t_name);
        
        -- Instalar el trigger genérico
        EXECUTE format('
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
        ', t_name);
        
        RAISE NOTICE 'Trigger set_updated_at creado exitosamente en tabla: %', t_name;
    END LOOP;
END $$;

COMMIT;

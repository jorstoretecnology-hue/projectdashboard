-- 🛡️ FASE 14: SECURITY HARDENING - METADATA IMMUTABILITY
-- Descripción: Garantiza que el tenant_id y created_at no puedan ser modificados tras el insert.

-- 1. Función General de Protección
CREATE OR REPLACE FUNCTION public.protect_row_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevenir el cambio de tenant_id (Mitigación Cross-tenant Attack)
    IF (TG_OP = 'UPDATE') THEN
        IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
            RAISE EXCEPTION 'ERROR DE SEGURIDAD F14: EL CAMBIO DE TENANT_ID NO ESTÁ PERMITIDO. OPERACIÓN BLOQUEADA.';
        END IF;

        -- Proteger la fecha de creación (Integridad de Auditoría)
        IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
            NEW.created_at := OLD.created_at;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aplicación Masiva a Tablas Críticas
DO $$ 
DECLARE 
    t text;
    tables_to_protect text[] := ARRAY[
        'products', 
        'customers', 
        'inventory_items', 
        'sales', 
        'suppliers', 
        'purchase_orders', 
        'service_orders', 
        'vehicles', 
        'subscriptions', 
        'payments',
        'tenant_quotas',
        'locations'
    ];
BEGIN
    FOR t IN SELECT unnest(tables_to_protect) LOOP
        -- Verificar si la tabla existe antes de crear el trigger
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS tr_protect_metadata ON public.%I', t);
            EXECUTE format('CREATE TRIGGER tr_protect_metadata BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.protect_row_metadata()', t);
        END IF;
    END LOOP;
END $$;

-- 3. Hardening Específico para Profiles
CREATE OR REPLACE FUNCTION public.protect_profile_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- El ID de usuario (PK) es inmutable
    IF OLD.id IS DISTINCT FROM NEW.id THEN
        RAISE EXCEPTION 'ERROR DE SEGURIDAD F14: EL ID DE USUARIO (PK) ES INMUTABLE.';
    END IF;

    -- El Tenant ID solo puede asignarse si es NULL, pero no cambiarse luego
    IF OLD.tenant_id IS NOT NULL AND OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'ERROR DE SEGURIDAD F14: EL TENANT_ID DE UN PERFIL NO PUEDE SER CAMBIADO UNA VEZ ASIGNADO.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_metadata ON public.profiles;
CREATE TRIGGER tr_protect_profile_metadata BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_metadata();

-- 4. Registro de Implementación en Audit Logs
INSERT INTO public.domain_events (tenant_id, event_type, payload)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- System Level
    'SECURITY_HARDENING_F14',
    '{"status": "applied", "features": ["metadata_immutability", "audit_protection", "profile_lockdown"]}'::jsonb
);

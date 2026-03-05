-- =============================================================================
-- Migración: 20260305000002_webhook_system.sql
-- Descripción: Sistema de Webhooks y Automatización con pg_net
-- =============================================================================

BEGIN;

-- 1. HABILITAR EXTENSIÓN PARA PETICIONES HTTP ASÍNCRONAS
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. TABLA DE SUSCRIPCIONES A WEBHOOKS
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    event_type VARCHAR(255) NOT NULL, -- Ej: 'customer.created', 'inventory.updated'
    secret VARCHAR(255), -- Para firmar el payload (opcional)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_subs_tenant_event ON public.webhook_subscriptions(tenant_id, event_type);

-- 3. TABLA DE LOGS DE WEBHOOKS (Integrado conceptualmente con Auditoría)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.webhook_subscriptions(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    request_id BIGINT, -- ID retornado por net.http_post
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    response_status_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POLÍTICAS RLS PARA SUSCRIPCIONES
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_subs_isolation" ON public.webhook_subscriptions;
CREATE POLICY "webhook_subs_isolation" ON public.webhook_subscriptions
    FOR ALL USING (tenant_id = public.get_current_user_tenant_id());

DROP POLICY IF EXISTS "webhook_logs_isolation" ON public.webhook_logs;
CREATE POLICY "webhook_logs_isolation" ON public.webhook_logs
    FOR ALL USING (tenant_id = public.get_current_user_tenant_id());

-- 4. FUNCIÓN PARA DESPACHAR EL WEBHOOK (CON FIRMA HMAC Y MANEJO DE FALLOS)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.dispatch_webhook()
RETURNS TRIGGER AS $$
DECLARE
    sub RECORD;
    payload JSONB;
    req_id BIGINT;
    event_name VARCHAR;
    record_tenant_id UUID;
    record_data JSONB;
    signature TEXT;
    req_headers JSONB;
    log_id UUID;
BEGIN
    -- 1. Identificar el tipo de evento y el registro base
    IF TG_OP = 'DELETE' THEN
        event_name := TG_TABLE_NAME || '.delete';
        record_tenant_id := OLD.tenant_id;
        record_data := row_to_json(OLD)::jsonb;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Detectar si es un Soft Delete
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            event_name := TG_TABLE_NAME || '.delete';
        ELSE
            event_name := TG_TABLE_NAME || '.update';
        END IF;
        record_tenant_id := NEW.tenant_id;
        record_data := row_to_json(NEW)::jsonb;
    ELSE -- INSERT
        event_name := TG_TABLE_NAME || '.insert';
        record_tenant_id := NEW.tenant_id;
        record_data := row_to_json(NEW)::jsonb;
    END IF;

    -- 2. Construir el payload base
    payload := jsonb_build_object(
        'event', event_name,
        'timestamp', NOW(),
        'tenant_id', record_tenant_id,
        'data', record_data
    );

    IF TG_OP = 'UPDATE' THEN
        payload := jsonb_set(payload, '{old_data}', row_to_json(OLD)::jsonb);
    END IF;

    -- 3. Buscar suscripciones activas para este evento y tenant
    FOR sub IN 
        SELECT id, url, secret FROM public.webhook_subscriptions 
        WHERE tenant_id = record_tenant_id 
          AND event_type = event_name 
          AND is_active = true
    LOOP
        -- 4. Construir headers (con firma HMAC si hay secret)
        IF sub.secret IS NOT NULL AND sub.secret <> '' THEN
            signature := encode(
                hmac(payload::text, sub.secret, 'sha256'),
                'hex'
            );
            req_headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-signature', 'sha256=' || signature
            );
        ELSE
            req_headers := '{"Content-Type": "application/json"}'::jsonb;
        END IF;

        -- 5. Insertar log ANTES del envío (estado PENDING)
        log_id := gen_random_uuid();
        INSERT INTO public.webhook_logs (id, subscription_id, tenant_id, event_type, payload, status)
        VALUES (log_id, sub.id, record_tenant_id, event_name, payload, 'PENDING');

        -- 6. Enviar petición asíncrona (con manejo de error)
        BEGIN
            req_id := net.http_post(
                url := sub.url,
                body := payload,
                headers := req_headers
            );
            -- Actualizar log con el request_id
            UPDATE public.webhook_logs SET request_id = req_id WHERE id = log_id;
        EXCEPTION WHEN OTHERS THEN
            -- Marcar como FAILED si pg_net falla
            UPDATE public.webhook_logs 
            SET status = 'FAILED', response_body = SQLERRM 
            WHERE id = log_id;
        END;
    END LOOP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CONFIGURACIÓN DE TRIGGERS EN TABLAS CLAVE

-- Customers
DROP TRIGGER IF EXISTS tr_customers_webhook ON public.customers;
CREATE TRIGGER tr_customers_webhook
    AFTER INSERT OR UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.dispatch_webhook();

-- Inventory Items
DROP TRIGGER IF EXISTS tr_inventory_webhook ON public.inventory_items;
CREATE TRIGGER tr_inventory_webhook
    AFTER INSERT OR UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.dispatch_webhook();

COMMIT;

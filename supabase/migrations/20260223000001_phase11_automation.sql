-- =============================================================================
-- Migración 20260223000001: Integración de Automatización (Webhooks)
-- =============================================================================

-- 1. Habilitar extensión HTTP (requerida para llamadas externas)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. FUNCIÓN: notify_webhook_event()
-- -----------------------------------------------------------------------------
-- Esta función toma un evento de dominio y lo envía a la URL de n8n/webhook.site
CREATE OR REPLACE FUNCTION public.notify_webhook_event()
RETURNS TRIGGER AS $$
DECLARE
    v_webhook_url TEXT := 'https://cauline-lacey-tempered.ngrok-free.dev/webhook-test/supabase-events'; -- URL Ngrok activa
    v_payload JSONB;
BEGIN
    -- Construir el payload
    v_payload := jsonb_build_object(
        'event_id', NEW.id,
        'tenant_id', NEW.tenant_id,
        'event_type', NEW.event_type,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id,
        'payload', NEW.payload,
        'created_at', NEW.created_at
    );

    -- Enviar POST
    PERFORM extensions.http_post(
        v_webhook_url,
        v_payload::TEXT,
        'application/json'
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallo silencioso para no bloquear el INSERT de la base de datos
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER: tr_on_domain_event_insert
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_on_domain_event_insert ON public.domain_events;
CREATE TRIGGER tr_on_domain_event_insert
    AFTER INSERT ON public.domain_events
    FOR EACH ROW EXECUTE FUNCTION public.notify_webhook_event();

-- Comentarios
COMMENT ON FUNCTION public.notify_webhook_event() IS 'Envía eventos de dominio a un webhook externo (n8n) mediante la extensión http';

-- =============================================================================
-- Migración: Estabilizar Webhook n8n (Producción)
-- =============================================================================

-- 1. Actualizar la función notify_webhook_event para usar el endpoint de producción
CREATE OR REPLACE FUNCTION public.notify_webhook_event()
RETURNS TRIGGER AS $$
DECLARE
    -- Usamos el dominio estático de Ngrok configurado en docker-compose.yml
    -- Cambiamos 'webhook-test' por 'webhook' para que sea permanente (Producción)
    v_webhook_url TEXT := 'https://cauline-lacey-tempered.ngrok-free.dev/webhook/supabase-events';
    v_payload JSONB;
BEGIN
    -- Construir el payload con datos enriquecidos
    v_payload := jsonb_build_object(
        'event_id', NEW.id,
        'tenant_id', NEW.tenant_id,
        'event_type', NEW.event_type,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id,
        'payload', NEW.payload,
        'created_at', NEW.created_at,
        'environment', 'production'
    );

    -- Enviar POST (Uso de extensions.http_post de la extensión pg_net/http)
    PERFORM extensions.http_post(
        v_webhook_url,
        v_payload::TEXT,
        'application/json'
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallo silencioso para no bloquear la transacción principal de la DB
    -- En producción se podría registrar esto en una tabla de errores de integración
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- El trigger ya debería existir por la migración previa 20260223000001
-- Pero lo re-aseguramos por si acaso
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_on_domain_event_insert') THEN
        CREATE TRIGGER tr_on_domain_event_insert
            AFTER INSERT ON public.domain_events
            FOR EACH ROW EXECUTE FUNCTION public.notify_webhook_event();
    END IF;
END $$;

COMMENT ON FUNCTION public.notify_webhook_event() IS 'Envía eventos de dominio al endpoint de PRODUCCIÓN de n8n';

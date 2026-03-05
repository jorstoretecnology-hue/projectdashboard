-- =============================================================================
-- MODO DEBUG: Cambiar a Webhook de Prueba
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_webhook_event()
RETURNS TRIGGER AS $$
DECLARE
    -- MODO TEST: Para que el usuario lo vea en el editor (barra naranja -> barra verde)
    v_webhook_url TEXT := 'https://cauline-lacey-tempered.ngrok-free.dev/webhook-test/supabase-events';
    v_payload JSONB;
BEGIN
    v_payload := jsonb_build_object(
        'event_id', NEW.id,
        'tenant_id', NEW.tenant_id,
        'event_type', NEW.event_type,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id,
        'payload', NEW.payload,
        'created_at', NEW.created_at,
        'debug_mode', true
    );

    PERFORM extensions.http_post(
        v_webhook_url,
        v_payload::TEXT,
        'application/json'
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

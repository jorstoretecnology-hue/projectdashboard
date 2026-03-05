-- =============================================================================
-- MIGRACIÓN: Refactoring SOLID del Trigger de Webhooks
-- Principio: Responsabilidad Única (SRP)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FUNCIÓN 1: build_domain_event_payload
-- Responsabilidad ÚNICA: Construir el JSON del evento.
-- Es PURA (IMMUTABLE), no genera efectos secundarios. Fácil de testear.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.build_domain_event_payload(
    event_id       UUID,
    tenant_id      UUID,
    event_type     TEXT,
    entity_type    TEXT,
    entity_id      UUID,
    payload        JSONB,
    created_at     TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN jsonb_build_object(
        'event_id',    event_id,
        'tenant_id',   tenant_id,
        'event_type',  event_type,
        'entity_type', entity_type,
        'entity_id',   entity_id,
        'payload',     payload,
        'created_at',  created_at,
        'schema_version', '1.0'
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- FUNCIÓN 2: notify_webhook_event (Trigger)
-- Responsabilidad ÚNICA: Despachar el payload a la URL de destino.
-- No construye datos, solo llama a build_domain_event_payload y envía.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_webhook_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_webhook_url CONSTANT TEXT := 'https://cauline-lacey-tempered.ngrok-free.dev/webhook/supabase-events';
    v_payload JSONB;
BEGIN
    -- Delega la construcción del payload a la función especializada
    v_payload := public.build_domain_event_payload(
        NEW.id,
        NEW.tenant_id,
        NEW.event_type,
        NEW.entity_type,
        NEW.entity_id,
        NEW.payload,
        NEW.created_at
    );

    -- Solo responsabilidad: HTTP dispatch
    PERFORM extensions.http_post(
        v_webhook_url,
        v_payload::TEXT,
        'application/json'
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallo silencioso para no bloquear la transacción de negocio
        RETURN NEW;
END;
$$;

-- Asegurar que el trigger sigue activo con la función actualizada
DROP TRIGGER IF EXISTS tr_on_domain_event_insert ON public.domain_events;

CREATE TRIGGER tr_on_domain_event_insert
    AFTER INSERT ON public.domain_events
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_webhook_event();

-- Comentarios de documentación
COMMENT ON FUNCTION public.build_domain_event_payload IS
    'Construye el payload JSON para un evento de dominio. Función pura, sin efectos secundarios. SRP: solo responsabilidad de construcción de datos.';

COMMENT ON FUNCTION public.notify_webhook_event IS
    'Trigger que despacha eventos de dominio al webhook de n8n. SRP: solo responsabilidad de HTTP dispatch.';

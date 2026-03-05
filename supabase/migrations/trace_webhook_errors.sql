-- =============================================================================
-- DEPURACIÓN AVANZADA: Captura de Errores HTTP
-- =============================================================================

-- 1. Crear una tabla temporal para ver los errores
CREATE TABLE IF NOT EXISTS public.webhook_debug_logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    url TEXT,
    payload TEXT,
    status_code TEXT,
    error_message TEXT,
    response_content TEXT
);

-- 2. Función actualizada que LOGUEA el resultado
CREATE OR REPLACE FUNCTION public.notify_webhook_event()
RETURNS TRIGGER AS $$
DECLARE
    v_webhook_url TEXT := 'https://cauline-lacey-tempered.ngrok-free.dev/webhook-test/supabase-events';
    v_response extensions.http_response;
    v_error_msg TEXT;
BEGIN
    BEGIN
        v_response := extensions.http_post(
            v_webhook_url,
            jsonb_build_object(
                'event_type', NEW.event_type,
                'entity_id', NEW.entity_id,
                'debug_id', NEW.id
            )::TEXT,
            'application/json'
        );

        -- Guardar el resultado para inspección
        INSERT INTO public.webhook_debug_logs (url, payload, status_code, response_content)
        VALUES (v_webhook_url, NEW.payload::TEXT, v_response.status::TEXT, v_response.content);

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
        INSERT INTO public.webhook_debug_logs (url, payload, error_message)
        VALUES (v_webhook_url, NEW.payload::TEXT, v_error_msg);
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Disparar evento de prueba
INSERT INTO public.domain_events (tenant_id, event_type, entity_type, entity_id, payload)
VALUES (
  '791b9026-c1be-4d25-9ad2-4199685a0275',
  'debug.connection_test',
  'debug',
  gen_random_uuid(),
  '{"test": "probando logs"}'
);

-- 4. CONSULTA ESTA TABLA PARA VER EL RESULTADO:
-- SELECT * FROM public.webhook_debug_logs ORDER BY created_at DESC;

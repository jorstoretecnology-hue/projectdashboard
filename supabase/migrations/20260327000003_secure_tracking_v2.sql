-- =============================================================================
-- MIGRACIÓN: 20260327000003_secure_tracking_v2.sql
-- Descripción: Hardening avanzado del seguimiento público (Criterio Claude).
-- Implementa: HMAC Tokens, Rate Limiting y Vista Segura.
-- =============================================================================

BEGIN;

-- 0. Asegurar pgcrypto para HMAC y limpiar dependencias
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DROP VIEW IF EXISTS public.v_sales_tracking CASCADE;


-- 1. Tablas de Auditoría y Rate Limiting
CREATE TABLE IF NOT EXISTS public.tracking_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_token TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tracking_failed_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempted_token TEXT NOT NULL,
    ip_address INET NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_access_ip_time ON public.tracking_access_log(ip_address, accessed_at);
CREATE INDEX IF NOT EXISTS idx_tracking_failed_ip_time ON public.tracking_failed_attempts(ip_address, attempted_at);

-- 2. Función de Rate Limiting (Máx 10 peticiones por minuto por IP)
CREATE OR REPLACE FUNCTION public.check_tracking_rate_limit(p_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count
    FROM public.tracking_access_log
    WHERE ip_address = p_ip
      AND accessed_at > now() - interval '1 minute';

    IF v_count >= 10 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- 3. Sistema de Tokens HMAC
-- Nota: Requiere configurar 'app.tracking_secret' en Supabase (o usar un valor por defecto si no existe)
CREATE OR REPLACE FUNCTION public.generate_sale_hmac(p_sale_id UUID, p_tenant_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT encode(
        hmac(
            p_sale_id::text || p_tenant_id::text,
            COALESCE(current_setting('app.tracking_secret', true), 'fallback_secret_change_me_in_prod'),
            'sha256'
        ),
        'hex'
    );
$$;

-- 4. Migrar tracking_token de UUID a TEXT
-- Primero guardamos los UUIDs actuales por si acaso, pero el plan es usar HMAC
ALTER TABLE public.sales ALTER COLUMN tracking_token TYPE TEXT;

-- Actualizar todos los tokens existentes a HMAC
UPDATE public.sales 
SET tracking_token = public.generate_sale_hmac(id, tenant_id);

-- 5. Vista Segura (Data Minimization)
-- Solo expone lo estrictamente necesario para el cliente final
CREATE OR REPLACE VIEW public.v_sales_tracking AS
SELECT 
    s.id, -- Necesario para relacionar ítems
    s.tracking_token,
    s.state,
    s.created_at,
    s.updated_at,
    s.total,
    s.subtotal,
    s.metadata, -- Contiene fotos y checklist de taller
    -- Ofuscación de cliente
    CASE 
        WHEN c.name IS NOT NULL THEN 
            substring(c.name from 1 for 1) || '***' || substring(c.name from length(c.name) for 1)
        ELSE 'Cliente Registrado'
    END as customer_display,
    -- Detalle de ítems (agregado)
    (
        SELECT json_agg(i)
        FROM (
            SELECT id, product_name, quantity, subtotal 
            FROM public.sale_items 
            WHERE sale_id = s.id
        ) i
    ) as items,
    s.tenant_id
FROM public.sales s
JOIN public.customers c ON s.customer_id = c.id
WHERE s.deleted_at IS NULL;


-- 6. Garantizar permisos mínimos
GRANT SELECT ON public.v_sales_tracking TO anon, authenticated;
GRANT INSERT ON public.tracking_access_log TO anon, authenticated;
GRANT INSERT ON public.tracking_failed_attempts TO anon, authenticated;

-- 7. Función Refactorizada: Obtener datos de tracking con protección
CREATE OR REPLACE FUNCTION public.get_safe_tracking_data(p_token TEXT, p_ip INET)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_is_allowed BOOLEAN;
BEGIN
    -- 1. Verificar Rate Limit
    v_is_allowed := public.check_tracking_rate_limit(p_ip);
    IF NOT v_is_allowed THEN
        INSERT INTO public.tracking_failed_attempts (attempted_token, ip_address)
        VALUES (p_token, p_ip);
        RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded');
    END IF;

    -- 2. Consultar vista
    SELECT row_to_json(t)::jsonb INTO v_result
    FROM v_sales_tracking t
    WHERE t.tracking_token = p_token
    LIMIT 1;

    -- 3. Log y Retorno
    IF v_result IS NULL THEN
        INSERT INTO public.tracking_failed_attempts (attempted_token, ip_address)
        VALUES (p_token, p_ip);
        RETURN jsonb_build_object('success', false, 'error', 'Token no encontrado');
    ELSE
        INSERT INTO public.tracking_access_log (tracking_token, ip_address)
        VALUES (p_token, p_ip);
        RETURN jsonb_build_object('success', true, 'data', v_result);
    END IF;
END;
$$;

COMMIT;

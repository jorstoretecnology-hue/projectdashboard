-- =============================================================================
-- MIGRACIÓN: 20260327000002_add_sale_tracking_token.sql
-- Descripción: Añade un token único para acceso público seguro a seguimiento.
-- =============================================================================

BEGIN;

-- 1. Añadir columna tracking_token
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();

-- 2. Crear índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_sales_tracking_token ON public.sales(tracking_token);

-- 3. Poblar registros existentes que no tengan token
UPDATE public.sales SET tracking_token = gen_random_uuid() WHERE tracking_token IS NULL;

-- 4. Hacerlo NOT NULL para el futuro
ALTER TABLE public.sales ALTER COLUMN tracking_token SET NOT NULL;

-- 5. Función para obtener ID de venta por token de forma segura
CREATE OR REPLACE FUNCTION public.get_sale_id_by_token(p_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios elevados para bypass RLS de lectura
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
BEGIN
    SELECT id INTO v_sale_id
    FROM sales
    WHERE tracking_token = p_token
    LIMIT 1;
    
    RETURN v_sale_id;
END;
$$;

-- 6. Función para registrar entrega via token (Seguro para acceso público)
CREATE OR REPLACE FUNCTION public.register_public_delivery(
    p_token UUID,
    p_signature_url TEXT,
    p_document TEXT,
    p_delivered_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
    v_state TEXT;
    v_metadata JSONB;
BEGIN
    -- Validar token y obtener datos mínimos
    SELECT id, state, metadata INTO v_sale_id, v_state, v_metadata
    FROM sales
    WHERE tracking_token = p_token
    LIMIT 1;

    IF v_sale_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token inválido');
    END IF;

    -- Validar estado (Solo permitir si no está ya cancelado o borrado)
    IF v_state IN ('CANCELADO', 'BORRADO') THEN
        RETURN jsonb_build_object('success', false, 'error', 'La orden no puede ser entregada en su estado actual');
    END IF;

    -- Actualizar metadata
    v_metadata = v_metadata || jsonb_build_object(
        'delivery_signature_url', p_signature_url,
        'delivery_document', p_document,
        'delivered_at', p_delivered_at
    );

    -- Ejecutar actualización
    UPDATE sales
    SET 
        state = 'ENTREGADO',
        metadata = v_metadata,
        updated_at = now()
    WHERE id = v_sale_id;

    RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);
END;
$$;

COMMIT;

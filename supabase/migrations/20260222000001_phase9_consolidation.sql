-- =============================================================================
-- Migración 20260222000001: Consolidación de Inventario y Unificación del Catálogo (Fase 9)
-- =============================================================================

-- 1. PREPARAR TABLA PRODUCTS (Catálogo Unificado)
-- -----------------------------------------------------------------------------

-- Agregar columnas necesarias si no existen (Postgres 9.6+ soporta IF NOT EXISTS en ADD COLUMN)
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'PRODUCT' CHECK (type IN ('PRODUCT', 'SERVICE'));
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(4,2) DEFAULT 0.19;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT 'IVA' CHECK (tax_type IN ('IVA', 'EXENTO', 'RESERVA'));

-- 2. RENOMBRAR TABLAS DE SERVICIOS (Arquitectura Operativa)
-- -----------------------------------------------------------------------------

-- Rename services to service_orders if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
        ALTER TABLE public.services RENAME TO service_orders;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_items') THEN
        ALTER TABLE public.service_items RENAME TO service_order_items;
    END IF;
END $$;

-- 3. MIGRACIÓN DE DATOS (inventory_items -> products)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
        -- Nota: Usamos una transacción implícita por el bloque DO
        INSERT INTO public.products (
            id, tenant_id, name, description, price, stock, sku, type, industry_type, category
        )
        SELECT 
            id, tenant_id, name, description, price, stock, sku, 'PRODUCT', 'taller', 'Legacy'
        FROM public.inventory_items
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 4. ACTUALIZAR FUNCIONES Y TRIGGERS (Apunta a service_orders)
-- -----------------------------------------------------------------------------

-- update_service_totals
CREATE OR REPLACE FUNCTION public.update_service_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.service_orders
  SET 
    labor_cost = (
      SELECT COALESCE(SUM(subtotal), 0) FROM public.service_order_items 
      WHERE service_id = NEW.service_id AND item_type = 'LABOR'
    ),
    parts_cost = (
      SELECT COALESCE(SUM(subtotal), 0) FROM public.service_order_items 
      WHERE service_id = NEW.service_id AND item_type = 'PART'
    ),
    updated_at = NOW()
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- complete_service_transaction
CREATE OR REPLACE FUNCTION public.complete_service_transaction(
  p_service_id UUID,
  p_tenant_id UUID,
  p_user_id UUID,
  p_new_state VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_service RECORD;
  v_item RECORD;
  v_product RECORD;
BEGIN
  -- 1. Validar Estado Destino
  IF p_new_state NOT IN ('REPARADO', 'ENTREGADO') THEN
     RAISE EXCEPTION 'Estado no válido para cierre de servicio';
  END IF;

  -- 2. Lock Service
  SELECT * INTO v_service
  FROM public.service_orders
  WHERE id = p_service_id AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de servicio no encontrada';
  END IF;

  -- 3. Si ya estaba completado, no volver a descontar
  IF v_service.state IN ('REPARADO', 'ENTREGADO') THEN
     RAISE EXCEPTION 'La orden ya fue completada anteriormente';
  END IF;

  -- 4. Procesar Items 'PART' para Stock
  FOR v_item IN 
    SELECT * FROM public.service_order_items 
    WHERE service_id = p_service_id AND item_type = 'PART' AND product_id IS NOT NULL
  LOOP
    -- Verificar product
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;
    
    IF FOUND AND v_product.stock IS NOT NULL THEN
       IF v_product.stock < v_item.quantity THEN
          RAISE EXCEPTION 'Stock insuficiente para repuesto: % (Requerido: %, Actual: %)', 
             v_item.description, v_item.quantity, v_product.stock;
       END IF;

       UPDATE public.products
       SET stock = stock - v_item.quantity
       WHERE id = v_product.id;
    END IF;
  END LOOP;

  -- 5. Actualizar Estado
  UPDATE public.service_orders
  SET 
    state = p_new_state,
    completed_at = CASE WHEN p_new_state = 'REPARADO' THEN NOW() ELSE completed_at END,
    delivered_at = CASE WHEN p_new_state = 'ENTREGADO' THEN NOW() ELSE delivered_at END,
    updated_at = NOW()
  WHERE id = p_service_id;

  RETURN jsonb_build_object(
    'id', p_service_id,
    'status', 'success',
    'new_state', p_new_state
  );
END;
$$;

-- 5. LIMPIEZA FINAL (COMENTADA POR SEGURIDAD)
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS inventory_items CASCADE; 

-- =============================================================================
-- Migración 05: Service Items & Completion RPC
-- Descripción:
-- 1. Crea tabla 'service_items' para detalle de ordenes de trabajo.
-- 2. Crea RPC 'complete_service_transaction' para cerrar orden y descontar items de inventario.
-- =============================================================================

-- 1. TABLA SERVICE_ITEMS
CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), -- Puede ser NULL para items ad-hoc? Mejor no, forzar producto 'Mano de Obra Generica' si es necesario. Dejamos opcional por flexibilidad inicial.
  
  description VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('PART', 'LABOR')),
  
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON service_items(service_id);
CREATE INDEX IF NOT EXISTS idx_service_items_product_id ON service_items(product_id);

ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

-- RLS: Heredado de Services
CREATE POLICY "service_items_all" ON service_items
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_items.service_id
      AND services.tenant_id = public.get_current_user_tenant_id()
    )
  );

-- 2. TRIGGER PARA ACTUALIZAR COSTOS EN HEADER
-- Al insertar/update/delete items, actualizar labor_cost y parts_cost en services
CREATE OR REPLACE FUNCTION public.update_service_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE services
  SET 
    labor_cost = (
      SELECT COALESCE(SUM(subtotal), 0) FROM service_items 
      WHERE service_id = NEW.service_id AND item_type = 'LABOR'
    ),
    parts_cost = (
      SELECT COALESCE(SUM(subtotal), 0) FROM service_items 
      WHERE service_id = NEW.service_id AND item_type = 'PART'
    ),
    updated_at = NOW()
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_service_totals
AFTER INSERT OR UPDATE OR DELETE ON service_items
FOR EACH ROW
EXECUTE FUNCTION public.update_service_totals();


-- 3. RPC: COMPLETE SERVICE (Cierre de Orden)
-- Cambia estado a 'REPARADO' o 'ENTREGADO' y descuenta stock de items tipo 'PART'.
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
  FROM services
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
    SELECT * FROM service_items 
    WHERE service_id = p_service_id AND item_type = 'PART' AND product_id IS NOT NULL
  LOOP
    -- Verificar product
    SELECT * INTO v_product FROM products WHERE id = v_item.product_id FOR UPDATE;
    
    IF FOUND AND v_product.stock IS NOT NULL THEN
       IF v_product.stock < v_item.quantity THEN
          RAISE EXCEPTION 'Stock insuficiente para repuesto: % (Requerido: %, Actual: %)', 
             v_item.description, v_item.quantity, v_product.stock;
       END IF;

       UPDATE products
       SET stock = stock - v_item.quantity
       WHERE id = v_product.id;
    END IF;
  END LOOP;

  -- 5. Actualizar Estado
  UPDATE services
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

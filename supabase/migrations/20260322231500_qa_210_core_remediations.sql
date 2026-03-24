-- =============================================================================
-- Migración: Core Remediations QA-210 (Ventas y Compras)
-- Descripción:
-- 1. cancel_sale_transaction: RPC para revertir stock de una venta cancelada.
-- 2. receive_purchase_transaction: Mejora para soportar recepciones parciales
--    y cálculo dinámico del estado final (PARCIAL o COMPLETA).
-- =============================================================================

-- =============================================================================
-- 1. RPC: Cancel Sale Transaction
-- =============================================================================
CREATE OR REPLACE FUNCTION cancel_sale_transaction(
  p_sale_id UUID,
  p_user_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale RECORD;
  v_item RECORD;
BEGIN
  -- Obtener la venta y bloquearla
  SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF v_sale.state = 'CANCELADA' THEN
    RAISE EXCEPTION 'La venta ya se encuentra cancelada';
  END IF;

  -- Restaurar stock iterando sobre los items de esa venta
  FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    -- Aumentar stock del producto
    UPDATE products 
    SET stock = stock + v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.product_id;

    -- Registrar movimiento de inventario revocado
    INSERT INTO inventory_movements (
      tenant_id, 
      product_id, 
      type, 
      quantity, 
      reference_type, 
      reference_id, 
      created_by,
      notes
    )
    VALUES (
      v_sale.tenant_id, 
      v_item.product_id, 
      'ENTRADA_CANCELACION', 
      v_item.quantity, 
      'VENTA', 
      p_sale_id, 
      p_user_id,
      'Reversión de stock por cancelación de venta'
    );
  END LOOP;

  -- Actualizar estado de la venta
  UPDATE sales SET 
    state = 'CANCELADA',
    updated_at = NOW()
  WHERE id = p_sale_id;

  RETURN jsonb_build_object('id', p_sale_id, 'status', 'success', 'message', 'Venta cancelada exitosamente y stock restaurado');
END;
$$;

-- =============================================================================
-- 2. RPC: Receive Purchase Transaction (Enhanced)
-- =============================================================================

DROP FUNCTION IF EXISTS receive_purchase_transaction(uuid, uuid, uuid, jsonb, text);

CREATE OR REPLACE FUNCTION receive_purchase_transaction(
  p_tenant_id UUID,
  p_purchase_id UUID,
  p_user_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_po RECORD;
  v_total_ordered INTEGER := 0;
  v_total_received INTEGER := 0;
  v_new_state VARCHAR;
BEGIN
  -- Verificar orden de compra
  SELECT * INTO v_po FROM purchase_orders 
  WHERE id = p_purchase_id AND tenant_id = p_tenant_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order not found';
  END IF;

  -- Procesar cada item recibido
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- 1. Aumentar stock del producto
    UPDATE products 
    SET stock = stock + (v_item->>'quantity_received')::INTEGER,
        updated_at = NOW()
    WHERE id = (v_item->>'product_id')::UUID 
      AND tenant_id = p_tenant_id;

    -- 2. Registrar movimiento de inventario
    INSERT INTO inventory_movements (
      tenant_id, 
      product_id, 
      type, 
      quantity, 
      reference_type, 
      reference_id, 
      created_by,
      notes
    ) VALUES (
      p_tenant_id, 
      (v_item->>'product_id')::UUID, 
      'COMPRA', 
      (v_item->>'quantity_received')::INTEGER, 
      'COMPRA', 
      p_purchase_id, 
      p_user_id,
      COALESCE(p_notes, 'Recepción de Mercancía')
    );
    
    -- 3. Actualizar el track de recibido en los detalles de la orden
    UPDATE purchase_order_items
    SET quantity_received = quantity_received + (v_item->>'quantity_received')::INTEGER
    WHERE purchase_order_id = p_purchase_id 
      AND product_id = (v_item->>'product_id')::UUID;
      
  END LOOP;

  -- 4. Calcular estado y actualizar la orden principal
  SELECT 
    COALESCE(SUM(quantity_ordered), 0), 
    COALESCE(SUM(quantity_received), 0)
  INTO v_total_ordered, v_total_received
  FROM purchase_order_items
  WHERE purchase_order_id = p_purchase_id;

  -- Si se recibió el total ordenado (o más por alguna distorsión), es COMPLETA.
  IF v_total_received >= v_total_ordered THEN
    v_new_state := 'RECIBIDA_COMPLETA';
  ELSE
    v_new_state := 'RECIBIDA_PARCIAL';
  END IF;

  UPDATE purchase_orders 
  SET 
    state = v_new_state,
    received_at = CASE WHEN v_new_state = 'RECIBIDA_COMPLETA' THEN NOW() ELSE received_at END,
    notes = CASE WHEN p_notes IS NOT NULL THEN CONCAT(notes, ' | Recibido (', NOW()::DATE, '): ', p_notes) ELSE notes END,
    updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object('id', p_purchase_id, 'status', 'success', 'new_state', v_new_state);
END;
$$;

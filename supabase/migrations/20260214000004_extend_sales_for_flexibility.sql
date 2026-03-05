-- =============================================================================
-- Migración 06: Extensión de Flexibilidad para Ventas
-- Descripción: Agrega soporte para metadatos (mesas, zonas) y notas por item.
-- =============================================================================

-- 1. Agregar metadata a Sales (JSONB es ideal para flexibilidad extrema)
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Agregar notas por Item (para instrucciones especiales de cocina o personalización)
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Actualizar la función RPC create_sale_transaction para procesar estas notas
CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  p_tenant_id UUID,
  p_user_id UUID,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_discount NUMERIC,
  p_tax_rate NUMERIC,
  p_notes TEXT,
  p_items JSONB, -- Ahora puede incluir 'notes' individualmente
  p_metadata JSONB DEFAULT '{}'::jsonb -- Nuevo parámetro de metadatos
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_final_unit_price NUMERIC;
  v_item_subtotal NUMERIC;
  v_sale_subtotal NUMERIC := 0;
  v_sale_tax NUMERIC := 0;
  v_sale_total NUMERIC := 0;
BEGIN
  -- Validar arrays no vacíos
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La venta debe tener al menos un item';
  END IF;

  -- 1. Insertar Header con metadata
  INSERT INTO sales (
    tenant_id,
    customer_id,
    created_by,
    state,
    subtotal,
    discount,
    tax,
    total,
    payment_method,
    notes,
    metadata
  ) VALUES (
    p_tenant_id,
    p_customer_id,
    p_user_id,
    'PAGADO',
    0, 
    p_discount,
    0, 
    0, 
    p_payment_method,
    p_notes,
    p_metadata
  ) RETURNING id INTO v_sale_id;

  -- 2. Procesar Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Bloquear producto
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no encontrado', (v_item->>'product_id');
    END IF;

    -- Validar y descontar stock
    IF v_product.stock IS NOT NULL THEN
      IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Stock insuficiente para %', v_product.name;
      END IF;
      UPDATE products SET stock = stock - (v_item->>'quantity')::INTEGER WHERE id = v_product.id;
    END IF;

    -- Precios
    v_final_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_product.price);
    v_item_subtotal := v_final_unit_price * (v_item->>'quantity')::INTEGER;
    v_sale_subtotal := v_sale_subtotal + v_item_subtotal;
    
    -- Insertar Line Item con notas
    INSERT INTO sale_items (
      sale_id,
      product_id,
      product_name,
      product_sku,
      unit_price,
      quantity,
      subtotal,
      notes -- Campo nuevo
    ) VALUES (
      v_sale_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_final_unit_price,
      (v_item->>'quantity')::INTEGER,
      v_item_subtotal,
      v_item->>'notes' -- Extraído del JSON de cada item
    );
  END LOOP;

  -- 3. Totales finales
  v_sale_tax := (v_sale_subtotal - p_discount) * p_tax_rate;
  IF v_sale_tax < 0 THEN v_sale_tax := 0; END IF;
  v_sale_total := v_sale_subtotal - p_discount + v_sale_tax;

  UPDATE sales SET subtotal = v_sale_subtotal, tax = v_sale_tax, total = v_sale_total WHERE id = v_sale_id;

  RETURN jsonb_build_object('id', v_sale_id, 'total', v_sale_total, 'status', 'success');
END;
$$;

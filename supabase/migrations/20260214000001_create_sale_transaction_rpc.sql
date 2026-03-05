-- =============================================================================
-- Migración: create_sale_transaction RPC
-- Descripción: Función atómica para crear ventas y descontar stock.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  p_tenant_id UUID,
  p_user_id UUID,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_discount NUMERIC,
  p_tax_rate NUMERIC,
  p_notes TEXT,
  p_items JSONB -- Array of {product_id, quantity, unit_price?, discount?}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER -- Ejecuta con permisos del usuario (respeta RLS)
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_final_unit_price NUMERIC;
  v_item_subtotal NUMERIC;
  v_item_total NUMERIC;
  v_sale_subtotal NUMERIC := 0;
  v_sale_tax NUMERIC := 0;
  v_sale_total NUMERIC := 0;
  v_new_stock INTEGER;
BEGIN
  -- 1. Validar arrays no vacíos
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La venta debe tener al menos un item';
  END IF;

  -- 2. Insertar Header de Venta (Inicial)
  -- Calcularemos totales reales iterando items.
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
    notes
  ) VALUES (
    p_tenant_id,
    p_customer_id,
    p_user_id,
    'PAGADO', -- Asumimos venta directa 'Point of Sale' por defecto. Si fuera Cotización, otro endpoint.
    0, -- Placeholder
    p_discount,
    0, -- Placeholder
    0, -- Placeholder
    p_payment_method,
    p_notes
  ) RETURNING id INTO v_sale_id;

  -- 3. Procesar Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- 3.1 Obtener Producto y Bloquear fila (FOR UPDATE) para evitar race conditions en stock
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no encontrado', (v_item->>'product_id');
    END IF;

    -- 3.2 Validar Stock
    -- Si es servicio o infinito (stock NULL), ignorar check? Asumimos NULL = infinito.
    -- Si stock no es NULL:
    IF v_product.stock IS NOT NULL THEN
      IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Stock insuficiente para producto: % (Stock actual: %, Solicitado: %)', 
          v_product.name, v_product.stock, (v_item->>'quantity');
      END IF;
      
      -- Descontar Stock
      UPDATE products
      SET stock = stock - (v_item->>'quantity')::INTEGER
      WHERE id = v_product.id;
    END IF;

    -- 3.3 Calcular Precios
    -- Si viene precio en payload, usarlo (override). Si no, usar precio producto.
    v_final_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_product.price);
    
    v_item_subtotal := v_final_unit_price * (v_item->>'quantity')::INTEGER;
    -- Descuento por item si aplica (simple)
    
    -- Acumular totales globales
    v_sale_subtotal := v_sale_subtotal + v_item_subtotal;
    
    -- 3.4 Insertar Sale Item
    INSERT INTO sale_items (
      sale_id,
      product_id,
      product_name,
      product_sku,
      unit_price,
      quantity,
      subtotal
    ) VALUES (
      v_sale_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_final_unit_price,
      (v_item->>'quantity')::INTEGER,
      v_item_subtotal
    );

  END LOOP;

  -- 4. Calcular Totales Finales Header
  -- Subtotal sumado de items
  -- Aplicar descuento global (monto fijo o %) -> Schema tiene discount numeric. Asumimos monto fijo por ahora.
  -- Tax
  
  v_sale_tax := (v_sale_subtotal - p_discount) * p_tax_rate;
  IF v_sale_tax < 0 THEN v_sale_tax := 0; END IF;
  
  v_sale_total := v_sale_subtotal - p_discount + v_sale_tax;

  -- 5. Actualizar Header con totales
  UPDATE sales
  SET 
    subtotal = v_sale_subtotal,
    tax = v_sale_tax,
    total = v_sale_total
  WHERE id = v_sale_id;

  -- 6. Retornar Resultado
  RETURN jsonb_build_object(
    'id', v_sale_id,
    'total', v_sale_total,
    'status', 'success'
  );

END;
$$;

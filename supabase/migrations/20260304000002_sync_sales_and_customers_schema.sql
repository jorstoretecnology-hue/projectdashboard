-- =============================================================================
-- Migración: Sincronización de Esquema para Ventas y Clientes
-- Objetivo: Asegurar que las columnas esperadas por el Portal Público y 
-- el SalesService existan.
-- =============================================================================

-- 1. Asegurar metadata y created_by en SALES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'metadata') THEN
        ALTER TABLE sales ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'created_by') THEN
        -- Intentar asociar un usuario existente si es necesario, o permitir NULL temporalmente
        ALTER TABLE sales ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Asegurar metadata en CUSTOMERS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'metadata') THEN
        ALTER TABLE customers ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Asegurar columnas en TENANTS para branding
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'settings') THEN
        ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 4. Re-crear RPC create_sale_transaction para que use las nuevas columnas (Versión Extendida)
CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  p_tenant_id UUID,
  p_user_id UUID,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_discount NUMERIC,
  p_tax_rate NUMERIC,
  p_notes TEXT,
  p_items JSONB,
  p_metadata JSONB DEFAULT '{}'::jsonb
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
  -- Insertar Header
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
    'PENDIENTE', -- Estado inicial corregido para flujo de taller
    0, 
    p_discount,
    0, 
    0, 
    p_payment_method,
    p_notes,
    p_metadata
  ) RETURNING id INTO v_sale_id;

  -- Procesar Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID AND tenant_id = p_tenant_id;
    
    v_final_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_product.price);
    v_item_subtotal := v_final_unit_price * (v_item->>'quantity')::INTEGER;
    v_sale_subtotal := v_sale_subtotal + v_item_subtotal;
    
    INSERT INTO sale_items (sale_id, product_id, product_name, product_sku, unit_price, quantity, subtotal)
    VALUES (v_sale_id, v_product.id, v_product.name, v_product.sku, v_final_unit_price, (v_item->>'quantity')::INTEGER, v_item_subtotal);
  END LOOP;

  -- Totales
  v_sale_tax := (v_sale_subtotal - p_discount) * p_tax_rate;
  v_sale_total := v_sale_subtotal - p_discount + v_sale_tax;

  UPDATE sales SET subtotal = v_sale_subtotal, tax = v_sale_tax, total = v_sale_total WHERE id = v_sale_id;

  RETURN jsonb_build_object('id', v_sale_id, 'total', v_sale_total, 'status', 'success');
END;
$$;

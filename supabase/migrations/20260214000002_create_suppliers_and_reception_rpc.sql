-- =============================================================================
-- Migración 04: Suppliers & Purchase Reception RPC
-- Descripción:
-- 1. Crea tabla 'suppliers'.
-- 2. Actualiza 'purchase_orders' para usar 'supplier_id'.
-- 3. Crea RPC 'receive_purchase_transaction' para entrada de mercancía.
-- =============================================================================

-- 1. TABLA SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  tax_id VARCHAR(50),
  address TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices y RLS para Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(tenant_id, name);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_all" ON suppliers
  USING (tenant_id = public.get_current_user_tenant_id());

-- 2. ACTUALIZAR PURCHASE_ORDERS
-- Agregamos columna supplier_id FK
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Opcional: Migrar datos si hubiera (pero asumimos DB limpia o nueva fase)
-- Si hay datos viejos sin supplier_id, quedarán NULL.

-- 3. RPC: RECEIVE PURCHASE (Entrada de Almacén)
CREATE OR REPLACE FUNCTION public.receive_purchase_transaction(
  p_purchase_id UUID,
  p_tenant_id UUID,
  p_user_id UUID,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_po RECORD;
  v_item RECORD;
  v_new_stock INTEGER;
BEGIN
  -- 1. Obtener y Bloquear Purchase Order
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = p_purchase_id AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de compra no encontrada';
  END IF;

  -- 2. Verificar estado (Solo permitir recibir si NO ha sido finalizada/rechazada)
  IF v_po.state IN ('RECIBIDA_COMPLETA', 'RECHAZADA', 'CANCELADA') THEN
    RAISE EXCEPTION 'La orden ya se encuentra en estado final: %', v_po.state;
  END IF;

  -- 3. Procesar Items y Aumentar Stock
  FOR v_item IN 
    SELECT * FROM purchase_order_items 
    WHERE purchase_order_id = p_purchase_id
  LOOP
    -- Actualizar Stock en Products
    UPDATE products
    SET stock = stock + v_item.quantity_ordered, -- Asumimos recepción completa por ahora
        -- Opcional: Actualizar precio de costo si se desea (promedio ponderado)
        updated_at = NOW()
    WHERE id = v_item.product_id;
    
    -- Actualizar cantidad recibida en item
    UPDATE purchase_order_items
    SET quantity_received = quantity_ordered
    WHERE id = v_item.id;
  END LOOP;

  -- 4. Actualizar Header
  UPDATE purchase_orders
  SET 
    state = 'RECIBIDA_COMPLETA',
    received_at = NOW(),
    notes = COALESCE(notes, '') || E'\n[Recibido]: ' || COALESCE(p_notes, ''),
    updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'id', p_purchase_id,
    'status', 'success',
    'new_state', 'RECIBIDA_COMPLETA'
  );
END;
$$;

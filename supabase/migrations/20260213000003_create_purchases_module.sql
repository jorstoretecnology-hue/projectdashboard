-- =============================================================================
-- Migración 03: Módulo de Compras
-- Ref: DATABASE_SCHEMA.md Sección 4
-- Crea: purchase_orders, purchase_order_items + índices + RLS
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: purchase_orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Proveedor
  supplier_name VARCHAR(255) NOT NULL,
  supplier_email VARCHAR(255),
  supplier_phone VARCHAR(50),

  -- Estado del flujo (DOMAIN_STATES.md)
  state VARCHAR(50) NOT NULL DEFAULT 'BORRADOR'
    CHECK (state IN ('BORRADOR', 'ENVIADA', 'CONFIRMADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_COMPLETA', 'RECHAZADA')),

  -- Información financiera
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),

  -- Fecha esperada de entrega
  expected_date DATE,

  -- Metadatos del flujo
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Usuario que creó
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Notas
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_state ON purchase_orders(tenant_id, state);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(tenant_id, created_at DESC);

-- RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_select" ON purchase_orders
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "purchase_orders_insert" ON purchase_orders
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "purchase_orders_update" ON purchase_orders
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "purchase_orders_delete" ON purchase_orders
  FOR DELETE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: purchase_order_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Cantidades
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),

  -- Precios
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_po_items_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product_id ON purchase_order_items(product_id);

-- RLS: Heredado de purchase_orders
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_items_select" ON purchase_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND (purchase_orders.tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "po_items_insert" ON purchase_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND purchase_orders.tenant_id = public.get_current_user_tenant_id()
    )
  );

CREATE POLICY "po_items_update" ON purchase_order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND purchase_orders.tenant_id = public.get_current_user_tenant_id()
    )
  );

CREATE POLICY "po_items_delete" ON purchase_order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND purchase_orders.tenant_id = public.get_current_user_tenant_id()
    )
  );

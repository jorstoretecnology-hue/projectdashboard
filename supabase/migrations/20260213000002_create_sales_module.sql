-- =============================================================================
-- Migración 02: Módulo de Ventas
-- Ref: DATABASE_SCHEMA.md Sección 3
-- Crea: sales, sale_items + índices + RLS
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: sales
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Relaciones
  customer_id UUID NOT NULL REFERENCES customers(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Estado del flujo (DOMAIN_STATES.md)
  state VARCHAR(50) NOT NULL DEFAULT 'COTIZACION'
    CHECK (state IN ('COTIZACION', 'PENDIENTE', 'PAGADO', 'ENTREGADO', 'RECHAZADO', 'CANCELADA')),

  -- Información financiera
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10,2) DEFAULT 0 CHECK (discount >= 0),
  tax NUMERIC(10,2) DEFAULT 0 CHECK (tax >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),

  -- Metadatos del flujo
  payment_method VARCHAR(50),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  -- Override (PERMISSIONS_MATRIX.md)
  is_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,

  -- Idempotencia
  idempotency_key VARCHAR(255),

  -- Notas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_state ON sales(tenant_id, state);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);

-- RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "sales_insert" ON sales
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "sales_update" ON sales
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "sales_delete" ON sales
  FOR DELETE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: sale_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Snapshot del producto al momento de venta
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),

  -- Descuento por item
  discount NUMERIC(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- RLS: Heredado de sales (acceso vía JOIN)
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_items_select" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND (sales.tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "sale_items_insert" ON sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.tenant_id = public.get_current_user_tenant_id()
    )
  );

CREATE POLICY "sale_items_update" ON sale_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.tenant_id = public.get_current_user_tenant_id()
    )
  );

CREATE POLICY "sale_items_delete" ON sale_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.tenant_id = public.get_current_user_tenant_id()
    )
  );

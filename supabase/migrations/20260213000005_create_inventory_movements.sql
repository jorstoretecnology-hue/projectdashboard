-- =============================================================================
-- Migración 05: Movimientos de Inventario
-- Ref: DATABASE_SCHEMA.md Sección 6
-- Crea: inventory_movements (trazabilidad completa de stock)
-- =============================================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Tipo de movimiento
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('VENTA', 'COMPRA', 'AJUSTE_MANUAL', 'REVERSA_VENTA', 'INICIAL')),

  -- Cantidad (positivo = entrada, negativo = salida)
  quantity INTEGER NOT NULL,

  -- Snapshot de stock en el momento
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,

  -- Referencia al documento que originó el movimiento
  reference_type VARCHAR(50), -- 'sale', 'purchase_order', 'manual'
  reference_id UUID,

  -- Usuario que realizó el movimiento
  created_by UUID REFERENCES auth.users(id),

  -- Notas
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inv_mov_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inv_mov_created_at ON inventory_movements(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_mov_reference ON inventory_movements(reference_type, reference_id);

-- RLS
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_movements_select" ON inventory_movements
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "inv_movements_insert" ON inventory_movements
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

-- No update/delete: los movimientos son inmutables (auditoría)

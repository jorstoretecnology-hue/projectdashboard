-- =============================================================================
-- Migración 07: Tablas de Auditoría Avanzada
-- Ref: DATABASE_SCHEMA.md Sección 8
-- Crea: state_audit_log, permission_denials
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: state_audit_log (Log inmutable de cambios de estado)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS state_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Entidad que cambió
  entity_type VARCHAR(50) NOT NULL, -- 'products', 'sales', 'services', 'purchase_orders'
  entity_id UUID NOT NULL,

  -- Estados
  old_state VARCHAR(50) NOT NULL,
  new_state VARCHAR(50) NOT NULL,

  -- Usuario que disparó el cambio
  triggered_by UUID REFERENCES auth.users(id),
  trigger_type VARCHAR(50) NOT NULL
    CHECK (trigger_type IN ('manual', 'automatic', 'override', 'system')),

  -- Razón (obligatoria para override)
  reason TEXT,

  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_state_audit_entity ON state_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_state_audit_tenant ON state_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_state_audit_trigger ON state_audit_log(trigger_type);

-- RLS
ALTER TABLE state_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_audit_select" ON state_audit_log
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "state_audit_insert" ON state_audit_log
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

-- No update/delete: log inmutable

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: permission_denials (Intentos de acceso denegado)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permission_denials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Acción intentada
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,

  -- Rol requerido vs actual
  required_role VARCHAR(50) NOT NULL,
  user_role VARCHAR(50) NOT NULL,

  -- Contexto
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_perm_denials_user ON permission_denials(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perm_denials_tenant ON permission_denials(tenant_id, created_at DESC);

-- RLS: Solo OWNER/ADMIN pueden ver denegaciones de su tenant
ALTER TABLE permission_denials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perm_denials_select" ON permission_denials
  FOR SELECT USING (
    (tenant_id = public.get_current_user_tenant_id()
     AND EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.app_role IN ('OWNER', 'ADMIN')
     ))
    OR public.is_super_admin()
  );

CREATE POLICY "perm_denials_insert" ON permission_denials
  FOR INSERT WITH CHECK (true); -- Cualquiera puede insertar (se registra automáticamente)

-- No update/delete: log inmutable

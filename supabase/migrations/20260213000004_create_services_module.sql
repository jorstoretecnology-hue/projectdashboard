-- =============================================================================
-- Migración 04: Módulo de Servicios (Taller Mecánico)
-- Ref: DATABASE_SCHEMA.md Sección 5
-- Crea: vehicles, services + índices + RLS con policy especial para empleados
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: vehicles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Información del vehículo
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER CHECK (year >= 1900 AND year <= 2100),
  plate VARCHAR(50) NOT NULL,
  vin VARCHAR(100),
  color VARCHAR(50),

  -- Metadatos
  mileage INTEGER,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Placa única por tenant
  CONSTRAINT vehicles_tenant_plate_unique UNIQUE(tenant_id, plate)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(tenant_id, plate);

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select" ON vehicles
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "vehicles_insert" ON vehicles
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "vehicles_update" ON vehicles
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "vehicles_delete" ON vehicles
  FOR DELETE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: services
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),

  -- Estado del flujo (DOMAIN_STATES.md)
  state VARCHAR(50) NOT NULL DEFAULT 'RECIBIDO'
    CHECK (state IN ('RECIBIDO', 'EN_PROCESO', 'BLOQUEADO', 'REPARADO', 'ENTREGADO')),

  -- Prioridad
  priority VARCHAR(20) DEFAULT 'NORMAL'
    CHECK (priority IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE')),

  -- Asignación de técnico
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,

  -- Descripción y diagnóstico
  description TEXT NOT NULL,
  diagnosis TEXT,

  -- Costos
  labor_cost NUMERIC(10,2) DEFAULT 0 CHECK (labor_cost >= 0),
  parts_cost NUMERIC(10,2) DEFAULT 0 CHECK (parts_cost >= 0),
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,

  -- Metadatos del flujo
  received_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Usuario que creó
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Notas
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_state ON services(tenant_id, state);
CREATE INDEX IF NOT EXISTS idx_services_customer_id ON services(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_vehicle_id ON services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_services_assigned_to ON services(assigned_to);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(tenant_id, created_at DESC);

-- RLS con policy especial para empleados
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- ADMIN/OWNER/SUPER_ADMIN: Ven todos los servicios del tenant
CREATE POLICY "services_select_admin" ON services
  FOR SELECT USING (
    (tenant_id = public.get_current_user_tenant_id()
     AND EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.app_role IN ('OWNER', 'ADMIN')
     ))
    OR public.is_super_admin()
  );

-- EMPLOYEE: Solo ve servicios asignados a él
CREATE POLICY "services_select_employee" ON services
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id()
    AND assigned_to = auth.uid()
  );

-- VIEWER: Ve todos los servicios del tenant (solo lectura)
CREATE POLICY "services_select_viewer" ON services
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.app_role = 'VIEWER'
    )
  );

CREATE POLICY "services_insert" ON services
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "services_update" ON services
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "services_delete" ON services
  FOR DELETE USING (
    tenant_id = public.get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.app_role IN ('OWNER', 'ADMIN')
    )
  );

-- =============================================================================
-- Migración 06: Sistema de Eventos y Automatizaciones
-- Ref: DATABASE_SCHEMA.md Sección 7
-- Crea: domain_events, automation_templates, tenant_automations, automation_executions
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: domain_events (Cola de eventos del sistema)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tipo de evento: 'products.state_changed', 'sales.state_changed', etc.
  event_type VARCHAR(100) NOT NULL,

  -- Entidad que generó el evento
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  -- Payload del evento (contiene old_state, new_state, entity_data, etc.)
  payload JSONB NOT NULL,

  -- Procesamiento
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_failed BOOLEAN DEFAULT FALSE,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices (el más importante: eventos no procesados)
CREATE INDEX IF NOT EXISTS idx_domain_events_unprocessed ON domain_events(processed, created_at)
  WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_domain_events_tenant_id ON domain_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_event_type ON domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_entity ON domain_events(entity_type, entity_id);

-- RLS
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domain_events_select" ON domain_events
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "domain_events_insert" ON domain_events
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

-- Update necesario para marcar como procesado (desde service role / cron)
CREATE POLICY "domain_events_update" ON domain_events
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: automation_templates (Catálogo maestro — tabla de sistema, sin tenant)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificador único del template
  template_key VARCHAR(100) NOT NULL UNIQUE,

  -- Metadatos
  name VARCHAR(255) NOT NULL,
  description TEXT,
  industry_type VARCHAR(50), -- NULL = disponible para todas las industrias

  -- Configuración del trigger
  trigger_event VARCHAR(100) NOT NULL, -- 'products.state_changed', 'sales.state_changed'
  trigger_condition JSONB, -- Condiciones adicionales: {"new_state": "REPARADO"}

  -- Template del mensaje
  message_template TEXT NOT NULL,

  -- Variables permitidas (whitelist)
  allowed_variables JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Canal por defecto
  default_channel VARCHAR(50) DEFAULT 'whatsapp',

  -- Prioridad
  priority VARCHAR(20) DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),

  -- Estado
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_auto_templates_trigger ON automation_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_auto_templates_industry ON automation_templates(industry_type);

-- Nota: automation_templates NO tiene RLS por tenant porque es una tabla de sistema.
-- Todos los tenants leen los mismos templates. Proteger con RLS de lectura global.
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auto_templates_select_all" ON automation_templates
  FOR SELECT USING (true); -- Todos pueden leer templates

CREATE POLICY "auto_templates_modify_admin" ON automation_templates
  FOR ALL USING (public.is_super_admin()); -- Solo SUPER_ADMIN modifica

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: tenant_automations (Configuración por tenant)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES automation_templates(id),

  -- Estado
  is_active BOOLEAN DEFAULT TRUE,

  -- Configuración específica del tenant
  config JSONB DEFAULT '{}'::jsonb,

  -- Canal preferido
  channel VARCHAR(50) DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'email', 'sms')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un tenant solo puede tener una configuración por template
  CONSTRAINT tenant_automations_unique UNIQUE(tenant_id, template_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_auto_tenant_id ON tenant_automations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_auto_is_active ON tenant_automations(tenant_id, is_active)
  WHERE is_active = TRUE;

-- RLS
ALTER TABLE tenant_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_auto_select" ON tenant_automations
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "tenant_auto_insert" ON tenant_automations
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "tenant_auto_update" ON tenant_automations
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "tenant_auto_delete" ON tenant_automations
  FOR DELETE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla: automation_executions (Log inmutable de ejecuciones)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES tenant_automations(id),

  -- Contexto de la ejecución
  event_id UUID REFERENCES domain_events(id),

  -- Resultado
  status VARCHAR(50) NOT NULL
    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'ABORTED_MISSING_DATA', 'SKIPPED_DUPLICATE')),

  -- Mensaje enviado
  channel VARCHAR(50),
  recipient VARCHAR(255),
  message_sent TEXT,

  -- Respuesta del proveedor externo
  external_message_id VARCHAR(255),
  provider_response JSONB,

  -- Reintentos
  retry_count INTEGER DEFAULT 0,

  -- Errores
  error_message TEXT,

  -- Idempotencia (evitar duplicados)
  idempotency_key VARCHAR(255) UNIQUE,

  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_auto_exec_tenant ON automation_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auto_exec_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_auto_exec_date ON automation_executions(tenant_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_exec_automation ON automation_executions(automation_id);

-- RLS
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auto_exec_select" ON automation_executions
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "auto_exec_insert" ON automation_executions
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

-- Update necesario para actualizar status/provider_response tras envío
CREATE POLICY "auto_exec_update" ON automation_executions
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

-- No delete: los logs de ejecución son inmutables

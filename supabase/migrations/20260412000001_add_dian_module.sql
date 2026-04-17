-- =============================================================================
-- Migración: Módulo DIAN (Facturación Electrónica Colombia)
-- Fecha: 2026-04-12
-- Crea: dian_provider_config, dian_invoice_logs
-- Actualiza: modules_catalog (agrega 'dian')
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Registrar módulo DIAN en el catálogo
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.modules_catalog (slug, name, description, compatible_types, is_available)
VALUES ('dian', 'Facturación DIAN', 'Facturación electrónica para Colombia via Alegra API', NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabla: dian_provider_config
-- Almacena credenciales encriptadas del proveedor (Alegra, Siigo, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dian_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Proveedor y ambiente
  provider_slug TEXT NOT NULL CHECK (provider_slug IN ('alegra', 'siigo')),
  environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'production')),

  -- Credenciales encriptadas (AES-256-GCM)
  credentials_encrypted TEXT NOT NULL,

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un tenant solo puede tener una config activa por proveedor+ambiente
  UNIQUE(tenant_id, provider_slug, environment)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dian_provider_tenant ON public.dian_provider_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dian_provider_active ON public.dian_provider_config(tenant_id, is_active);

-- RLS
ALTER TABLE public.dian_provider_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dian_provider_select" ON public.dian_provider_config
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "dian_provider_insert" ON public.dian_provider_config
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "dian_provider_update" ON public.dian_provider_config
  FOR UPDATE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

CREATE POLICY "dian_provider_delete" ON public.dian_provider_config
  FOR DELETE USING (
    tenant_id = public.get_current_user_tenant_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tabla: dian_invoice_logs
-- Registro inmutable de operaciones DIAN (envío, cancelación, sincronización)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dian_invoice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id),

  -- Proveedor utilizado
  provider_slug TEXT,

  -- Operación realizada
  operation TEXT NOT NULL CHECK (operation IN ('send', 'cancel', 'sync')),

  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,

  -- Referencias externas
  provider_invoice_id TEXT,
  cude TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dian_logs_tenant ON public.dian_invoice_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dian_logs_sale ON public.dian_invoice_logs(sale_id);
CREATE INDEX IF NOT EXISTS idx_dian_logs_created ON public.dian_invoice_logs(tenant_id, created_at DESC);

-- RLS
ALTER TABLE public.dian_invoice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dian_logs_select" ON public.dian_invoice_logs
  FOR SELECT USING (
    tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin()
  );

CREATE POLICY "dian_logs_insert" ON public.dian_invoice_logs
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
  );

-- No UPDATE ni DELETE — logs son inmutables

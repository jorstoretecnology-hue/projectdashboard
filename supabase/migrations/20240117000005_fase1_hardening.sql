-- -----------------------------------------------------------------------------
-- FASE 1: FOUNDATION & REAL OPERABILITY (FINAL HARDENING)
-- -----------------------------------------------------------------------------

-- 1. Robust SuperAdmin Check
-- Verifica el rol directamente desde los claims del JWT de Supabase
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.is_super_admin();
    DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
      OR (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

-- 2. Tabla de Auditoría (Si no existe)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'PLAN_CHANGE', etc.
    entity_type TEXT NOT NULL, -- 'INVENTORY', 'CUSTOMER', etc.
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit Logs Isolation" ON public.audit_logs
FOR SELECT USING (
    tenant_id = get_current_user_tenant_id() 
    OR is_super_admin()
);

-- 3. Tabla de Tenants Cleanup (Si no existe)
-- Nota: La tabla ya existe por migración 01, pero aseguramos integridad
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 4. Tabla de Perfiles (Sync con Auth)
-- Aseguramos que el trigger de profiles esté activo (ya definido en migración 03)

-- 5. Tabla de Quotas (Source of Truth)
-- Aseguramos que existe y tiene RLS
ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quota View Policy" ON public.tenant_quotas;
CREATE POLICY "Quota View Policy" ON public.tenant_quotas
FOR SELECT USING (
    tenant_id = get_current_user_tenant_id()
    OR is_super_admin()
);

-- 6. Vista Ejecutiva Reforzada
CREATE OR REPLACE VIEW public.view_saas_metrics AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.plan,
    t.industry_type,
    t.is_active,
    (SELECT COALESCE(SUM(current_usage), 0) FROM public.tenant_quotas q WHERE q.tenant_id = t.id AND q.resource_key = 'maxInventoryItems') as total_inventory,
    (SELECT COALESCE(SUM(current_usage), 0) FROM public.tenant_quotas q WHERE q.tenant_id = t.id AND q.resource_key = 'maxCustomers') as total_customers,
    (SELECT COUNT(*) FROM public.audit_logs a WHERE a.tenant_id = t.id AND a.created_at > (NOW() - INTERVAL '24 hours')) as activity_24h
FROM public.tenants t;

-- Permisos
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

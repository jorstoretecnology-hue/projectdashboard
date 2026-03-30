-- =============================================================================
-- Migración: 20260325000008_consolidate_webhooks_and_fix_roles.sql
-- Descripción: Consolidación de webhooks y estandarización de roles RLS
-- =============================================================================

BEGIN;

-- 1. ELIMINAR TABLA DUPLICADA
DROP TABLE IF EXISTS public.webhook_events CASCADE;

-- 2. AJUSTAR WEBHOOK_LOGS PARA WEBHOOKS ENTRANTES (MERCADOPAGO)
ALTER TABLE public.webhook_logs ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS source TEXT;

-- 3. ÍNDICE PARCIAL PARA PROCESAMIENTO EFICIENTE (REQUERIDO POR USUARIO)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_unprocessed 
ON public.webhook_logs(created_at) 
WHERE status = 'PENDING';

-- 4. ESTANDARIZACIÓN DE ROLES RLS (superadmin -> SUPER_ADMIN)

-- Profiles
DROP POLICY IF EXISTS "SuperAdmins can view all profiles" ON public.profiles;
CREATE POLICY "SuperAdmins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated 
    USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'SUPER_ADMIN'::text);

DROP POLICY IF EXISTS "Admins can view tenant profiles" ON public.profiles;
CREATE POLICY "Admins can view tenant profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        (tenant_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text))::uuid) 
        AND (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['ADMIN'::text, 'SUPER_ADMIN'::text]))
    );

-- Tenants
DROP POLICY IF EXISTS "Tenants Isolation Policy" ON public.tenants;
CREATE POLICY "Tenants Isolation Policy" ON public.tenants
    FOR ALL TO authenticated
    USING (
        (id = (((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text))::uuid) 
        OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'SUPER_ADMIN'::text)
    );

-- Tenant Quotas
DROP POLICY IF EXISTS "Quotas View Access" ON public.tenant_quotas;
CREATE POLICY "Quotas View Access" ON public.tenant_quotas
    FOR SELECT TO authenticated
    USING (
        (tenant_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text))::uuid) 
        OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'SUPER_ADMIN'::text)
    );

-- Customers (Granular Isolation)
DROP POLICY IF EXISTS "customers_granular_isolation" ON public.customers;
CREATE POLICY "customers_granular_isolation" ON public.customers
    FOR ALL TO authenticated
    USING (
        (tenant_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text))::uuid) 
        AND (
            (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'SUPER_ADMIN'::text])) 
            OR (location_id IN (SELECT user_locations.location_id FROM user_locations WHERE user_locations.user_id = auth.uid() AND user_locations.is_active = true)) 
            OR (location_id IS NULL)
        ) 
        AND (deleted_at IS NULL)
    );

COMMIT;

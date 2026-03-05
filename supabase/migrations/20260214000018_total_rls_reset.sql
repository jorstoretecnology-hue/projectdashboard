-- =============================================================================
-- RESET MAESTRO DE RLS (VERSIÓN FIX SYNC-FIRST)
-- =============================================================================

-- 1. Limpieza total de políticas conflictivas (Corregido para Postgres)
DO $$ 
DECLARE 
    tbl text; pol record; 
BEGIN
    FOR tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenants', 'profiles', 'tenant_quotas') LOOP
        FOR pol IN SELECT p.polname FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE c.relname = tbl AND n.nspname = 'public' LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.polname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- 2. Reglas para TENANTS
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Permitir insertar a cualquier autenticado (el código ahora pre-genera el ID)
CREATE POLICY "tenants_onboarding_insert" ON public.tenants 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- Permitir ver la propia empresa (usando el vínculo del perfil o el JWT)
CREATE POLICY "tenants_resilient_select" ON public.tenants 
    FOR SELECT TO authenticated 
    USING (
        public.is_super_admin() 
        OR id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '00000000-0000-0000-0000-000000000000'))::uuid 
        OR id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- 3. Reglas para PROFILES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_rule" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (auth.uid() = id OR public.is_super_admin());

-- Muy importante: El usuario DEBE poder actualizar su perfil para el "Sync-First"
CREATE POLICY "profiles_update_rule" ON public.profiles 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- 4. Reglas para TENANT_QUOTAS
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_quotas_onboarding_insert" ON public.tenant_quotas 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

CREATE POLICY "tenant_quotas_select_rule" ON public.tenant_quotas 
    FOR SELECT TO authenticated 
    USING (
        public.is_super_admin() 
        OR tenant_id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '00000000-0000-0000-0000-000000000000'))::uuid
        OR tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- 5. Permisos Finales
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.tenant_quotas TO authenticated;

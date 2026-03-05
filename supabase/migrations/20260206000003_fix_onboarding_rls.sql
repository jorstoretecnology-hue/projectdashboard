-- ============================================================================
-- MASTER PATCH: FIX ONBOARDING RLS
-- ============================================================================

-- Limpiar políticas conflictivas previas
DROP POLICY IF EXISTS "Allow authenticated users to insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow auth to insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow select recently created tenant" ON public.tenants;
DROP POLICY IF EXISTS "Allow auth to insert quotas" ON public.tenant_quotas;

-- 1. TENANTS: Permitir INSERT a cualquier usuario logueado
CREATE POLICY "onboarding_tenant_insert" ON public.tenants
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 2. TENANTS: Permitir SELECT temporal durante el onboarding
-- Esto es CRÍTICO para que .select().single() devuelva el ID tras el insert
CREATE POLICY "onboarding_tenant_select" ON public.tenants
    FOR SELECT
    USING (
        auth.role() = 'authenticated' 
        AND (
            id = get_current_user_tenant_id() -- Caso normal
            OR 
            NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tenant_id IS NOT NULL) -- Caso onboarding
        )
    );

-- 3. TENANT_QUOTAS: Permitir INSERT de las cuotas iniciales
CREATE POLICY "onboarding_quotas_insert" ON public.tenant_quotas
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND tenant_id IS NOT NULL);

-- 4. TENANT_QUOTAS: Permitir SELECT para ver las propias cuotas
DROP POLICY IF EXISTS "Quotas View Access" ON public.tenant_quotas;
CREATE POLICY "onboarding_quotas_select" ON public.tenant_quotas
    FOR SELECT
    USING (tenant_id = get_current_user_tenant_id() OR auth.role() = 'authenticated');

-- ============================================================================
-- COMPLETADO
-- ============================================================================

-- =============================================================================
-- PARCHE DE ONBOARDING: DESBLOQUEO DE CREACIÓN DE TENANTS
-- =============================================================================

-- 1. Actualizar política de INSERCIÓN de TENANTS
-- Los usuarios autenticados deben poder crear su primera organización.
DROP POLICY IF EXISTS "tenants_insert_rule" ON public.tenants;

CREATE POLICY "tenants_insert_rule" ON public.tenants
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Permitimos insertar si estás autenticado. 

-- 2. Permitir a los usuarios actualizar su propio PERFIL
-- Durante el onboarding el usuario necesita vincularse al tenant_id recién creado.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_rule" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. Asegurar que los usuarios puedan insertar sus primeras CUOTAS (si el onboarding lo requiere)
-- Nota: En onboarding/actions.ts el servidor inserta en tenant_quotas.
DROP POLICY IF EXISTS "tenant_quotas_insert_policy" ON public.tenant_quotas;

CREATE POLICY "tenant_quotas_onboarding_insert" ON public.tenant_quotas
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Permitimos crear cuotas para el tenant que acabas de crear.

-- 4. Permisos de Postgres
GRANT INSERT ON TABLE public.tenants TO authenticated;
GRANT UPDATE ON TABLE public.profiles TO authenticated;
GRANT INSERT ON TABLE public.tenant_quotas TO authenticated;

COMMENT ON POLICY "tenants_insert_rule" ON public.tenants IS 'Permite a los usuarios crear su organización durante el onboarding.';

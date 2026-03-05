-- =============================================================================
-- PARCHE DE RESILIENCIA RLS (SOLUCIÓN DEFINITIVA A MÓDULOS INVISIBLES)
-- =============================================================================

-- 1. Actualizar política de selección de TENANTS
-- Ahora permite ver el tenant si está en el JWT O si está en tu perfil de la base de datos.
DROP POLICY IF EXISTS "tenants_select_rule" ON public.tenants;

CREATE POLICY "tenants_select_rule" ON public.tenants
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin() 
        OR id = (COALESCE(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '00000000-0000-0000-0000-000000000000'))::uuid
        OR id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- 2. Asegurar que PROFILES se pueda leer por el propio usuario
-- Sin esto, el paso 1 fallaría por recursión o falta de permisos.
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "profiles_select_rule" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_super_admin());

-- 3. Dar permisos explícitos a las tablas (por si acaso faltan para el rol authenticated)
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

COMMENT ON POLICY "tenants_select_rule" ON public.tenants IS 'Permite ver el tenant vía JWT o backup en tabla profiles (Resiliencia SaaS).';

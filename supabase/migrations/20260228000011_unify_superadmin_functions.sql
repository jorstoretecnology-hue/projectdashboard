-- =============================================================================
-- UNIFICACIÓN DE FUNCIONES DE SUPERADMIN (Fase SRE)
-- =============================================================================
-- Corrige el conflicto entre is_super_admin() e is_superadmin()

-- 1. Redefinir la lógica real en ambas funciones para evitar discrepancias
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_groups ug
        JOIN security_groups sg ON ug.group_id = sg.id
        WHERE ug.user_id = auth.uid()
        AND sg.name = 'group_system'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delegamos en la función principal para mantener consistencia
    RETURN public.is_superadmin();
END;
$$;

-- 2. Asegurar que la tabla tenants tenga políticas de inserción para Superadmins
-- La política 'FOR ALL' con 'USING' suele ser insuficiente para INSERT si no hay 'WITH CHECK'
-- o si Postgres espera una política específica de INSERT.

DROP POLICY IF EXISTS tenants_super_admin_full_access ON tenants;

CREATE POLICY tenants_super_admin_full_access ON tenants
    FOR ALL
    TO authenticated
    USING ( public.is_superadmin() )
    WITH CHECK ( public.is_superadmin() );

-- Garantizar que SuperAdmin tenga permisos en la tabla (GRANT)
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

COMMENT ON FUNCTION public.is_super_admin() IS 'Alias compatible con is_superadmin() para evitar errores de RLS en tablas antiguas.';

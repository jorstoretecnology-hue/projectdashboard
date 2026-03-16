-- =============================================================================
-- FIX: VISIBILIDAD DE TENANTS PARA SUPERADMIN
-- Mejorar la función is_superadmin para que sea más resiliente
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Verificar por app_role en perfiles (Fuente de verdad actual)
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND app_role = 'SUPER_ADMIN'
    ) THEN
        RETURN TRUE;
    END IF;

    -- 2. Verificar por app_metadata en el JWT
    IF (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'SUPER_ADMIN' THEN
        RETURN TRUE;
    END IF;

    -- 3. Verificar por grupos de seguridad (Compatibilidad con versiones anteriores)
    IF EXISTS (
        SELECT 1
        FROM user_groups ug
        JOIN security_groups sg ON ug.group_id = sg.id
        WHERE ug.user_id = auth.uid()
        AND sg.name = 'group_system'
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Asegurar redundancia de alias
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.is_superadmin();
END;
$$;

-- Notificación de éxito
SELECT 'Función is_superadmin actualizada correctamente.' as status;

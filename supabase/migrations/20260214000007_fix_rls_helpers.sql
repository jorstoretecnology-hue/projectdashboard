-- =============================================================================
-- Migración: Corregir Helpers de Seguridad RLS
-- Descripción: Repara la función is_super_admin() que estaba bloqueada en FALSE
-- permitiendo que las políticas de seguridad funcionen correctamente.
-- =============================================================================

-- 1. Reparar is_super_admin para buscar el rol real en la tabla profiles
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.is_super_admin();
    DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND (app_role = 'SUPER_ADMIN' OR (app_metadata->>'app_role') = 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurar que get_current_user_tenant_id sea robusto
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    tid UUID;
BEGIN
    -- Intentar obtener del JWT
    tid := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    
    -- Si no está en el JWT, buscar en la tabla profiles como fallback
    IF tid IS NULL THEN
        SELECT tenant_id INTO tid FROM public.profiles WHERE id = auth.uid();
    END IF;
    
    RETURN tid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON FUNCTION is_super_admin IS 'Verifica si un usuario tiene el rol SUPER_ADMIN consultando profiles.';
COMMENT ON FUNCTION get_current_user_tenant_id IS 'Obtiene el tenant_id del usuario actual desde JWT o Profiles.';

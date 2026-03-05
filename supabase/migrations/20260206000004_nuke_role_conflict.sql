-- ============================================================================
-- SANEAMIENTO FINAL: JWT CLAIMS Y ROLES DE APLICACIÓN
-- ============================================================================

-- 1. Normalizar la tabla de perfiles para aceptar el rol 'user'
-- El esquema actual lo bloqueaba por un CHECK constraint.
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('superadmin', 'admin', 'staff', 'user'));

-- 2. Función maestra para inyectar claims en el JWT
-- NOTA CRÍTICA: Eliminamos la clave 'role' y usamos 'app_role'
-- Esto evita que Supabase intente ejecutar 'SET ROLE user' en Postgres.
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
  u_features text[];
BEGIN
  -- Obtener datos reales del perfil
  SELECT role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  -- Obtener features del tenant si existe
  IF u_tenant IS NOT NULL THEN
    SELECT feature_flags INTO u_features FROM public.tenants WHERE id = u_tenant;
  END IF;

  -- LIMPIEZA TOTAL: Borramos la clave 'role' si existiera para evitar el error de Postgres
  new.raw_app_meta_data = (coalesce(new.raw_app_meta_data, '{}'::jsonb) - 'role') || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'user'), -- Valor por defecto para la APP
      'tenant_id', u_tenant,
      'features', COALESCE(u_features, '{}'::text[])
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Limpiar todos los usuarios existentes de la "mancha" del rol viejo
UPDATE auth.users 
SET raw_app_meta_data = (COALESCE(raw_app_meta_data, '{}'::jsonb) - 'role');

-- 4. Asegurarnos que el proceso de onboarding ponga el rol correcto en 'profiles'
-- Al crear la empresa, el usuario debe ser 'admin' (que ya es válido).

-- ============================================================================
-- COMPLETADO
-- ============================================================================

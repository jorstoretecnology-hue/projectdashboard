-- ============================================================================
-- PURGA TOTAL Y CONSOLIDACIÓN DE SEGURIDAD (FIX ROLE 'USER')
-- ============================================================================

-- 1. Eliminar cualquier rastro del rol conflictivo en Postgres
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'user') THEN
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM "user";
    DROP ROLE "user";
  END IF;
END
$$;

-- 2. Normalizar Perfiles (Aceptar 'user' como valor de aplicación)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('superadmin', 'admin', 'staff', 'user'));

-- 3. ELIMINAR TODOS LOS DISPARADORES REDUNDANTES (Limpiar la mesa)
DROP TRIGGER IF EXISTS on_auth_user_created_update_jwt ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. FUNCIÓN ÚNICA Y ATÓMICA DE CLAIMS (Sin la palabra 'role')
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
  u_features text[];
BEGIN
  -- 1. Obtener datos reales de las tablas de la APP
  SELECT role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  IF u_tenant IS NOT NULL THEN
    SELECT feature_flags INTO u_features FROM public.tenants WHERE id = u_tenant;
  END IF;

  -- 2. Limpieza Quirúrgica: USAMOS EL OPERADOR '-' PARA BORRAR 'role'
  -- Esto asegura que NUNCA llegue esa palabra al JWT claims.
  new.raw_app_meta_data = (COALESCE(new.raw_app_meta_data, '{}'::jsonb) - 'role') || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'user'), -- Lo llamamos app_role
      'tenant_id', u_tenant,
      'features', COALESCE(u_features, '{}'::text[])
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RE-INSTALAR EL DISPARADOR MAESTRO
CREATE TRIGGER on_auth_user_created_update_jwt
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_jwt_claims();

-- 6. FUNCIÓN DE CREACIÓN DE PERFIL (Simplificada)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. LIMPIEZA DE USUARIOS EXISTENTES
UPDATE auth.users SET raw_app_meta_data = (raw_app_meta_data - 'role');

-- ============================================================================
-- SISTEMA SANEADO
-- ============================================================================

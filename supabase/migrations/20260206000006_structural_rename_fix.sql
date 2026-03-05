-- ============================================================================
-- PARCHE MAESTRO: RENOMBRAMIENTO ESTRUCTURAL PARA EVITAR CONFLICTO 'ROLE'
-- ============================================================================

-- 1. RENOMBRAR COLUMNA EN PROFILES
-- Esto desvincula totalmente nuestra lógica de la palabra reservada de Postgres.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles RENAME COLUMN role TO app_role;
  END IF;
END $$;

-- 2. ASEGURAR ROLES PERMITIDOS
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (app_role IN ('superadmin', 'admin', 'staff', 'user'));

-- 3. LIMPIEZA ATÓMICA DE CUALQUIER TRIGGER QUE USE 'ROLE'
DROP TRIGGER IF EXISTS on_auth_user_created_update_jwt ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. FUNCIÓN MAESTRA DE CLAIMS DEFINITIVA
-- Inyecta 'app_role' y ELIMINA 'role' explícitamente.
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  -- Consultamos el nuevo nombre de la columna 'app_role'
  SELECT app_role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  -- SANEAMIENTO: Usamos el operador (-) para forzar la eliminación de la clave 'role'
  new.raw_app_meta_data = (COALESCE(new.raw_app_meta_data, '{}'::jsonb) - 'role') || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'user'),
      'tenant_id', u_tenant
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RE-INSTALAR DISPARADOR MAESTRO
CREATE TRIGGER on_auth_user_created_update_jwt
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_jwt_claims();

-- 6. FUNCIÓN DE CREACIÓN DE PERFIL ACTUALIZADA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, app_role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. PURGA GLOBAL DE SESIONES
-- Forzamos a que TODOS los usuarios pierdan la clave 'role' de sus metadatos.
UPDATE auth.users SET raw_app_meta_data = (raw_app_meta_data - 'role');

-- 8. ELIMINAR EL ROL FÍSICO QUE NOS DIO PROBLEMAS
DROP ROLE IF EXISTS "user";

-- ============================================================================
-- FIN DEL CONFLICTO: 'role' ya no existe en la base de datos ni en el JWT
-- ============================================================================

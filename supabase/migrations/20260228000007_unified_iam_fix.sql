-- =============================================================================
-- PARCHE DE SANEAMIENTO TOTAL IAM: UNIFICACIÓN DE TRIGGERS Y ROLES
-- =============================================================================

-- 1. LIMPIEZA DE REGLAS OBSOLETAS
-- Eliminamos todas las restricciones que puedan chocar (mayúsculas/minúsculas)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_app_role_check;

-- 2. REPARACIÓN DEL GUARDIA DE PERMISOS (CLAIMS)
-- Este trigger se ejecuta ANTES. Lo hacemos "no destructivo" para que no borre
-- el rol que necesitamos para crear el perfil.
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  -- Consultamos el perfil (si ya existe)
  SELECT app_role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  -- Sincronizamos metadatos sin borrar la intención original ('role') durante el registro
  new.raw_app_meta_data = COALESCE(new.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, (new.raw_app_meta_data->>'role'), 'VIEWER'),
      'tenant_id', u_tenant
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REPARACIÓN DEL GUARDIA DE PERFILES (NUEVOS USUARIOS)
-- Este trigger se ejecuta DESPUÉS. Lee el rol de forma segura y lo normaliza.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_clean_role TEXT;
BEGIN
    -- 1. Capturar el rol desde los metadatos técnicos (raw_app_meta_data)
    v_clean_role := UPPER(COALESCE(new.raw_app_meta_data->>'role', 'VIEWER'));

    -- 2. Asegurar que el rol sea uno de los permitidos por el sistema
    IF v_clean_role NOT IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER') THEN
        v_clean_role := 'VIEWER';
    END IF;

    -- 3. Inserción atómica en profiles (sin columna 'email' que ya no existe)
    INSERT INTO public.profiles (id, full_name, app_role)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        v_clean_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        app_role = EXCLUDED.app_role;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RE-INSTALACIÓN LIMPIA DE DISPARADORES
DROP TRIGGER IF EXISTS on_auth_user_created_update_jwt ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Primero Claims (BEFORE)
CREATE TRIGGER on_auth_user_created_update_jwt
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_jwt_claims();

-- Luego Perfil (AFTER)
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notificar finalización en logs
COMMENT ON TABLE public.profiles IS 'Perfil IAM saneado: Triggers unificados y restricciones de rol normalizadas a UPPERCASE.';

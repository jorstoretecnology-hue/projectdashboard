-- PARCHE MAESTRO UNIFICADO: Sincronización Total de Triggers y Roles
-- Este script corrige la colisión entre 'handle_jwt_claims' y 'handle_new_user'.

-- 1. Función de Claims (Corregida)
-- No borra el rol original durante la creación y permite el flujo a handle_new_user.
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  -- Intentamos obtener el rol del perfil
  SELECT app_role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  -- Sincronizamos app_metadata
  -- Mantenemos el 'role' original si no hay perfil aún (fase de creación)
  -- 'VIEWER' es el valor por defecto seguro que cumple con la restricción CHECK.
  new.raw_app_meta_data = COALESCE(new.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, (new.raw_app_meta_data->>'role'), 'VIEWER'),
      'tenant_id', u_tenant
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función de Nuevo Usuario (Corregida)
-- Robusta contra nombres de columnas dinámicos y formatos de rol.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_target_role TEXT;
BEGIN
    -- Capturamos el rol desde los metadatos de la aplicación
    -- Usamos el campo 'role' que enviamos desde nuestra API Route
    v_target_role := UPPER(COALESCE(new.raw_app_meta_data->>'role', 'VIEWER'));

    -- Validación extra de los roles permitidos para evitar fallos del CHECK constraint
    IF v_target_role NOT IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER') THEN
        v_target_role := 'VIEWER';
    END IF;

    -- Inserción/Actualización en profiles
    INSERT INTO public.profiles (id, full_name, app_role)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        v_target_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        app_role = EXCLUDED.app_role;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-instalación limpia de Triggers
DROP TRIGGER IF EXISTS on_auth_user_created_update_jwt ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- handle_jwt_claims debe ir ANTES para preparar el entorno del JWT
CREATE TRIGGER on_auth_user_created_update_jwt
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_jwt_claims();

-- handle_new_user debe ir DESPUÉS para guardar el registro una vez validado auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notificar éxito técnico
COMMENT ON FUNCTION public.handle_jwt_claims() IS 'Parche Maestro: Unificado con handle_new_user para flujo de creación IAM.';

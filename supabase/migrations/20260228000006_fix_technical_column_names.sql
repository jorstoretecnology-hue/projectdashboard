-- PARCHE CRÍTICO: Corrección de nombres de columnas internas de Supabase Auth
-- El error 'Database error creating new user' se debe a que 'app_metadata' no existe como columna
-- física; el nombre correcto es 'raw_app_meta_data'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Insertar en profiles usando los campos JSONB correctos de auth.users
    -- raw_user_meta_data -> para el nombre y avatar
    -- raw_app_meta_data  -> para el rol (enviado desde nuestra API)
    INSERT INTO public.profiles (id, full_name, app_role)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        UPPER(COALESCE(new.raw_app_meta_data->>'role', 'VIEWER'))
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        app_role = EXCLUDED.app_role;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar que el trigger está correctamente vinculado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Corregir también el trigger de claims para evitar inconsistencias con 'USER'
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  -- Buscamos el rol en profiles (que ya fue creado por handle_new_user o existe previo)
  SELECT app_role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  -- Sanitizamos el app_role para que no use 'USER' (no permitido en check constraint)
  -- Si no hay perfil, usamos 'VIEWER' como base segura
  new.raw_app_meta_data = (COALESCE(new.raw_app_meta_data, '{}'::jsonb) - 'role') || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'VIEWER'),
      'tenant_id', u_tenant
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger reparado: Usa raw_app_meta_data en lugar de app_metadata para evitar error de columna.';

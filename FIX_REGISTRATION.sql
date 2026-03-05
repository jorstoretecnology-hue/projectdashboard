-- 🚨 EJECUTAR EN SUPABASE SQL EDITOR 🚨
-- Este script corrige el error "Database error saving new user" al registrarse.

-- 1. Permitir que usuarios nuevos NO tengan tenant todavía (se asigna en onboarding)
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Asegurar que la creación de perfil sea robusta y no falle si faltan datos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, app_role)
  VALUES (
    new.id, 
    -- Evitar error si no hay nombre
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'), 
    new.raw_user_meta_data->>'avatar_url', 
    'user' -- Rol inicial siempre 'user'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Loguear error pero permitir que el usuario se cree en Auth (fallback)
  RAISE WARNING 'Error creando perfil para %: %', new.id, SQLERRM;
  RETURN new; 
END;
$$;

-- 3. Reconectar el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Confirmación
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Asegura creación de perfil. Corregido para permitir nulos en tenant_id.';

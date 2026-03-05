-- PARCHE FINAL: Corrección de error de columna inexistente 'email' en profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- 1. Capturar el rol del app_metadata (enviado por la API)
    -- Se normaliza a MAYÚSCULAS para cumplir con la restricción CHECK
    v_role := UPPER(COALESCE(new.app_metadata->>'role', 'VIEWER'));

    -- 2. Insertar en profiles SIN la columna 'email' (no existe en este esquema)
    INSERT INTO public.profiles (id, full_name, avatar_url, app_role)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url', 
        v_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        app_role = EXCLUDED.app_role;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar que el trigger está activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log de éxito
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger corregido: Removida columna email y normalizado app_role a UPPERCASE.';

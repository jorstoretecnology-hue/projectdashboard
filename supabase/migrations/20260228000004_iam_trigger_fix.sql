-- Migración: Fase 13 - Parche Final de Sincronización (DBA Agent)
-- Corrige el trigger de creación de perfiles para que use el estándar de MAYÚSCULAS y capture el rol de los metadatos.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- 1. Capturar el rol del app_metadata (enviado por la API) o defecto 'VIEWER'
    -- Se convierte a MAYÚSCULAS para cumplir con el CHECK constraint
    v_role := UPPER(COALESCE(new.app_metadata->>'role', 'VIEWER'));

    -- 2. Insertar en la tabla profiles con los mapeos correctos
    INSERT INTO public.profiles (id, email, full_name, avatar_url, app_role)
    VALUES (
        new.id, 
        new.email,
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

-- Re-instalar el trigger (por seguridad)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notificar éxito en logs de Supabase
DO $$ BEGIN RAISE NOTICE 'Trigger handle_new_user actualizado a estándar UPPERCASE exitosamente.'; END $$;

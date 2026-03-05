-- =============================================================================
-- SCRIPT DE REPARACIÓN: RESTAURAR ROL SUPERADMIN
-- Instrucciones: 
-- 1. Reemplaza 'TU_EMAIL_AQUI' por tu correo de superadmin.
-- 2. Ejecuta este script en el SQL Editor de Supabase.
-- =============================================================================

DO $$
DECLARE
    target_email TEXT := 'johnjortiz018@gmail.com'; -- CAMBIA ESTO
    v_user_id UUID;
BEGIN
    -- 1. Obtener el ID del usuario desde auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = target_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No se encontró el usuario con email: %', target_email;
        RETURN;
    END IF;

    -- 2. Asegurar que el perfil existe con el rol correcto
    -- Nota: La tabla usa 'app_role' y los valores son 'SUPER_ADMIN'
    INSERT INTO public.profiles (id, app_role, full_name)
    VALUES (v_user_id, 'SUPER_ADMIN', 'Super Administrador')
    ON CONFLICT (id) DO UPDATE 
    SET app_role = 'SUPER_ADMIN',
        tenant_id = NULL;

    -- 3. Actualizar metadatos de Auth (app_metadata)
    UPDATE auth.users 
    SET raw_app_meta_data = raw_app_meta_data || 
        jsonb_build_object(
            'app_role', 'SUPER_ADMIN',
            'role', 'SUPER_ADMIN',
            'tenant_id', NULL
        )
    WHERE id = v_user_id;

    RAISE NOTICE 'Usuario % promovido a superadmin exitosamente.', target_email;
END $$;

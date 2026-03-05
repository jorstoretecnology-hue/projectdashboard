-- =============================================================================
-- SCRIPT: NUKE & REBIRTH (REINICIO TOTAL)
-- Descripción: Limpia todos los datos de tenants, perfiles y metadatos corruptos.
-- Deja el sistema listo para un inicio fresco con el SuperAdmin oficial.
-- =============================================================================

DO $$
DECLARE
    target_email TEXT := 'johnjortiz018@gmail.com'; -- TU EMAIL AQUÍ
    v_user_id UUID;
BEGIN
    -- 1. Obtener ID del usuario
    SELECT id INTO v_user_id FROM auth.users WHERE email = target_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Error: No se encontró el usuario %. Asegúrate de estar registrado.', target_email;
        RETURN;
    END IF;

    -- 2. LIMPIEZA TOTAL (Cascada)
    -- Esto borrará TODO: tenants, ventas, inventario, perfiles de otros.
    TRUNCATE public.tenants CASCADE;
    TRUNCATE public.profiles CASCADE;
    
    RAISE NOTICE 'Limpieza de tablas completada.';

    -- 3. RESTAURACIÓN DEL SUPERADMIN (ESTÁNDAR OFICIAL)
    INSERT INTO public.profiles (id, app_role, full_name)
    VALUES (v_user_id, 'SUPER_ADMIN', 'Super Administrador Principal')
    ON CONFLICT (id) DO UPDATE 
    SET app_role = 'SUPER_ADMIN',
        tenant_id = NULL;

    -- 4. LIMPIEZA Y UPDATE DE METADATOS AUTH
    -- Eliminamos claves viejas (role) y forzamos las nuevas (app_role: SUPER_ADMIN)
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_build_object(
            'app_role', 'SUPER_ADMIN',
            'role', 'SUPER_ADMIN',
            'tenant_id', NULL
        )
    WHERE id = v_user_id;

    -- 5. RESET PARA OTROS USUARIOS (Si existieran en Auth pero no en perfiles)
    -- Les quitamos cualquier rol de admin previo
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_build_object('app_role', 'VIEWER')
    WHERE id != v_user_id;

    RAISE NOTICE 'Reinicio completado para %. Ahora puedes iniciar sesión como SUPER_ADMIN.', target_email;
END $$;

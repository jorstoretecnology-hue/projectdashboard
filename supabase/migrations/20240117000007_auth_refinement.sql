-- -----------------------------------------------------------------------------
-- REFUERZO DE AUTH: ASIGNACIÓN DE TENANT POR DEFECTO
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_role TEXT;
BEGIN
    -- 1. Determinar Rol
    v_role := COALESCE(new.app_metadata->>'role', 'user');

    -- 2. Determinar Tenant
    -- Si viene en metadata, usar ese.
    v_tenant_id := (new.app_metadata->>'tenant_id')::uuid;

    -- Si es un usuario normal y no trae tenant, asignar el tenant 'Demo/Free' por defecto
    -- para evitar que el perfil quede huérfano (Point 2.2 Checklist)
    IF v_tenant_id IS NULL AND v_role != 'superadmin' THEN
        SELECT id INTO v_tenant_id FROM public.tenants WHERE name ILIKE '%Demo%' LIMIT 1;
        
        -- Si no hay demo, usar el primero disponible
        IF v_tenant_id IS NULL THEN
            SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
        END IF;
    END IF;

    -- 3. Insertar Perfil
    INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
    values (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name',
        v_role,
        v_tenant_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

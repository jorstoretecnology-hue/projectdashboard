-- =============================================================================
-- SCRIPT DE REPARACIÓN "HARDCORE" (EJECUTAR EN SUPABASE)
-- =============================================================================

DO $$ 
DECLARE 
    target_user_id uuid;
    target_tenant_id uuid;
BEGIN
    -- 1. Obtener ID del usuario 
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'ghostsnake27@gmail.com';
    
    -- 2. Obtener ID del Tenant (Taller 1)
    SELECT id INTO target_tenant_id FROM public.tenants WHERE name ILIKE '%Taller 1%' OR name ILIKE '%Taller1%' LIMIT 1;

    -- 3. DIAGNÓSTICO (Se verá en los mensajes del SQL Editor)
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'CRÍTICO: El usuario ghostsnake27@gmail.com no existe en auth.users';
    END IF;
    
    IF target_tenant_id IS NULL THEN
        -- Si no existe, lo creamos para no quedarnos bloqueados
        INSERT INTO public.tenants (name, plan, active_modules, industry_type)
        VALUES ('Taller 1', 'enterprise', ARRAY['Dashboard', 'Inventory', 'Customers', 'Settings', 'Billing'], 'taller')
        RETURNING id INTO target_tenant_id;
        RAISE NOTICE 'AVISO: Taller 1 no existía, se ha creado con ID %', target_tenant_id;
    END IF;

    -- 4. VINCULACIÓN TOTAL
    -- Asegurar que el perfil existe y tiene los datos correctos
    INSERT INTO public.profiles (id, tenant_id, app_role)
    VALUES (target_user_id, target_tenant_id, 'OWNER')
    ON CONFLICT (id) DO UPDATE 
    SET 
        tenant_id = EXCLUDED.tenant_id,
        app_role = 'OWNER',
        updated_at = now();

    -- 5. REFUERZO DE MÓDULOS
    UPDATE public.tenants 
    SET active_modules = ARRAY['Dashboard', 'Inventory', 'Customers', 'Settings', 'Billing']
    WHERE id = target_tenant_id;

    RAISE NOTICE '¡ÉXITO! Usuario % vinculado al taller % como OWNER', target_user_id, target_tenant_id;
END $$;

-- =============================================================================
-- SCRIPT DE VINCULACIÓN TOTAL (LIMPIEZA Y REPARACIÓN)
-- =============================================================================

DO $$ 
DECLARE 
    v_tenant_id uuid;
    v_user_id uuid;
BEGIN
    -- 1. Buscar al usuario ghostsnake27
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'ghostsnake27@gmail.com';
    
    -- 2. Buscar el Tenant (Taller 1)
    SELECT id INTO v_tenant_id FROM public.tenants WHERE name ILIKE '%Taller 1%' OR name ILIKE '%Taller1%' LIMIT 1;
    
    -- 3. Si ambos existen, forzar la vinculación perfecta
    IF v_tenant_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Vincular en Profiles
        UPDATE public.profiles 
        SET 
            tenant_id = v_tenant_id, 
            app_role = 'OWNER' 
        WHERE id = v_user_id;
        
        -- Asegurar módulos ACTIVOS en el Tenant
        UPDATE public.tenants 
        SET active_modules = ARRAY['Dashboard', 'Inventory', 'Customers', 'Settings', 'Billing']
        WHERE id = v_tenant_id;
        
        -- Marcar invitación como aceptada si existía alguna
        UPDATE public.invitations 
        SET status = 'accepted'
        WHERE email = 'ghostsnake27@gmail.com' AND tenant_id = v_tenant_id;

        RAISE NOTICE 'REPARACIÓN EXITOSA: Usuario vinculado a %', v_tenant_id;
    ELSE
        RAISE EXCEPTION 'ERROR: No se encontró el usuario ghostsnake27 o el Tenant Taller 1';
    END IF;
END $$;

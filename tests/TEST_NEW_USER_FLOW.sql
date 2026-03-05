-- 1. Variables para el test
DO $$
DECLARE
    v_new_user_id UUID := gen_random_uuid();
    v_email TEXT := 'test_new_user_' || floor(random() * 1000)::text || '@example.com';
    v_tenant_id UUID;
    v_plan TEXT;
    v_role TEXT;
    v_cust_limit INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando Test de Flujo de Nuevo Usuario...';

    -- 2. Simular Registro en auth.users
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (v_new_user_id, v_email, '{"full_name": "Test User"}'::jsonb, now(), now());

    -- 3. Simular Trigger de Perfil (o crearlo manual si el trigger no corre en este contexto)
    -- Asumimos que el trigger on_auth_user_created existe, pero por seguridad lo insertamos si no existe
    INSERT INTO public.profiles (id, email)
    VALUES (v_new_user_id, v_email)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Usuario creado: %', v_email;

    -- 4. Simular Onboarding (Llamada a initialize_new_organization con defaults)
    -- plan default es 'free' si no se especifica? No, el frontend lo manda.
    -- Simulamos lo que manda el frontend por defecto: plan='free'
    SELECT public.initialize_new_organization(
        p_name := 'Test Tenant Organization',
        p_plan := 'free',
        p_industry := 'taller',
        p_user_id := v_new_user_id
    ) INTO v_tenant_id;

    RAISE NOTICE 'Organización creada: %', v_tenant_id;

    -- 5. Validaciones
    
    -- Validar Plan del Tenant
    SELECT plan INTO v_plan FROM public.tenants WHERE id = v_tenant_id;
    IF v_plan != 'free' THEN
        RAISE EXCEPTION 'FALLO: El plan debería ser free, pero es %', v_plan;
    ELSE
        RAISE NOTICE 'ÉXITO: Plan es free.';
    END IF;

    -- Validar Rol del Usuario
    SELECT app_role INTO v_role FROM public.profiles WHERE id = v_new_user_id;
    IF v_role != 'ADMIN' THEN
        RAISE EXCEPTION 'FALLO: El rol debería ser ADMIN, pero es %', v_role;
    ELSE
        RAISE NOTICE 'ÉXITO: Rol es ADMIN.';
    END IF;

    -- Validar Quotas (Free = 10 clientes)
    SELECT max_limit INTO v_cust_limit FROM public.tenant_quotas WHERE tenant_id = v_tenant_id AND resource_key = 'maxCustomers';
    IF v_cust_limit != 10 THEN
        RAISE EXCEPTION 'FALLO: Limite de clientes incorrecto para plan free. Esperado: 10, Obtenido: %', v_cust_limit;
    ELSE
        RAISE NOTICE 'ÉXITO: Quotas correctas para plan Free.';
    END IF;

    RAISE NOTICE '✅ TEST DE FLUJO COMPLETADO EXITOSAMENTE';

    -- Limpieza (Rollback manual si no usamos transaccion, pero aqui borramos para no ensuciar)
    -- DELETE FROM auth.users WHERE id = v_new_user_id; 
    -- (Nota: Borrar de auth.users cascadea a profiles, pero tenants no esta cascadeando quizas?
    -- Mejor dejarlo para inspeccion o borrar explicitamente)
    
    -- Limpieza explícita
    DELETE FROM public.tenant_quotas WHERE tenant_id = v_tenant_id;
    DELETE FROM public.tenants WHERE id = v_tenant_id;
    DELETE FROM public.profiles WHERE id = v_new_user_id;
    DELETE FROM auth.users WHERE id = v_new_user_id;

    RAISE NOTICE '🧹 Limpieza completada.';

END $$;

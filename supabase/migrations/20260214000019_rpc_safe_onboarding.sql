-- =============================================================================
-- FUNCION MAESTRA: INITIALIZE_NEW_ORGANIZATION (Sincronización Total)
-- Descripción: Encapsula creación de Tenant, Perfil y SINCRONIZA JWT.
-- Tipo: SECURITY DEFINER (Bypassa RLS para garantizar el onboarding)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.initialize_new_organization(
    p_name TEXT,
    p_plan TEXT,
    p_industry TEXT,
    p_user_id UUID,
    p_modules TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_customers_limit INTEGER;
    v_inventory_limit INTEGER;
BEGIN
    -- 1. Insertar el Tenant
    INSERT INTO public.tenants (
        name,
        plan,
        industry_type,
        active_modules,
        is_active
    ) VALUES (
        p_name,
        p_plan,
        p_industry,
        p_modules,
        true
    ) RETURNING id INTO v_tenant_id;

    -- 2. Vincular el Perfil del Usuario (Verdad en DB)
    UPDATE public.profiles
    SET 
        tenant_id = v_tenant_id,
        app_role = 'ADMIN',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 3. Sincronizar Metadatos en auth.users (Verdad en JWT)
    -- Esto asegura que refreshSession() obtenga el tenant_id inmediatamente.
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'tenant_id', v_tenant_id,
            'app_role', 'ADMIN'
        )
    WHERE id = p_user_id;

    -- 4. Definir Límites (Quotas)
    IF p_plan = 'pro' THEN
        v_customers_limit := 100;
        v_inventory_limit := 200;
    ELSIF p_plan = 'enterprise' THEN
        v_customers_limit := 1000;
        v_inventory_limit := 2000;
    ELSE
        v_customers_limit := 10;
        v_inventory_limit := 20;
    END IF;

    -- 5. Insertar Quotas
    INSERT INTO public.tenant_quotas (tenant_id, resource_key, max_limit, current_usage)
    VALUES 
    (v_tenant_id, 'maxCustomers', v_customers_limit, 0),
    (v_tenant_id, 'maxInventoryItems', v_inventory_limit, 0);

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos
GRANT EXECUTE ON FUNCTION public.initialize_new_organization TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_new_organization TO service_role;

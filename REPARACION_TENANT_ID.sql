-- ============================================================================
-- SCRIPT DE REPARACIÓN: Asignar Tenant ID al Usuario
-- ============================================================================
-- Fecha: 2026-02-15
-- Problema: Usuario ghostsnake27@gmail.com tiene tenant_id: NULL
-- Solución: Asignar tenant existente al usuario

-- PASO 1: Verificar tenants disponibles
SELECT 
  id,
  name,
  plan,
  created_at
FROM public.tenants
ORDER BY created_at DESC
LIMIT 5;

-- PASO 2: Asignar el primer tenant activo al usuario
-- (Ajusta el WHERE si quieres un tenant específico)
DO $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'ghostsnake27@gmail.com';
  
  -- Obtener el primer tenant
  SELECT id INTO v_tenant_id
  FROM public.tenants
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Si no hay tenant, crear uno nuevo
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, plan)
    VALUES ('Mi Organización', 'standard')
    RETURNING id INTO v_tenant_id;
    
    RAISE NOTICE 'Tenant creado: %', v_tenant_id;
  END IF;
  
  -- Actualizar auth.users metadata
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object('tenant_id', v_tenant_id)
  WHERE id = v_user_id;
  
  -- Actualizar public.profiles
  UPDATE public.profiles
  SET tenant_id = v_tenant_id
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Usuario actualizado con tenant_id: %', v_tenant_id;
  
  -- Inicializar quotas si no existen
  INSERT INTO public.tenant_quotas (tenant_id, resource_key, max_limit, current_usage)
  VALUES 
    (v_tenant_id, 'maxCustomers', 100, 0),
    (v_tenant_id, 'maxInventory', 500, 0)
  ON CONFLICT (tenant_id, resource_key) DO NOTHING;
  
  RAISE NOTICE 'Quotas inicializadas para tenant: %', v_tenant_id;
END $$;

-- PASO 3: Verificar que la reparación funcionó
SELECT 
  u.id as user_id,
  u.email,
  u.raw_app_meta_data->>'tenant_id' as tenant_id_meta,
  p.tenant_id as profile_tenant_id,
  t.name as tenant_name,
  t.plan
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE u.email = 'ghostsnake27@gmail.com';

-- Resultado esperado: tenant_id_meta y profile_tenant_id deben tener el mismo UUID

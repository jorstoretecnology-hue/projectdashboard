-- ============================================================================
-- REPARACIÓN AUTOMÁTICA CON INDUSTRY_TYPE
-- ============================================================================

-- PASO 1: Crear tenant con todos los campos obligatorios
INSERT INTO public.tenants (name, plan, industry_type)
VALUES ('Mi Organización', 'professional', 'taller')
ON CONFLICT DO NOTHING
RETURNING id, name, plan, industry_type;

-- PASO 2: Asignar tenant al usuario (auth.users)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'tenant_id', (
    SELECT id FROM public.tenants 
    WHERE name = 'Mi Organización' 
    ORDER BY created_at DESC 
    LIMIT 1
  )
)
WHERE email = 'ghostsnake27@gmail.com'
RETURNING 
  id, 
  email, 
  raw_app_meta_data->>'tenant_id' as tenant_id;

-- PASO 3: Asignar tenant al perfil
UPDATE public.profiles
SET tenant_id = (
  SELECT id FROM public.tenants 
  WHERE name = 'Mi Organización' 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE id = (SELECT id FROM auth.users WHERE email = 'ghostsnake27@gmail.com')
RETURNING id, tenant_id;

-- PASO 4: Inicializar quotas
INSERT INTO public.tenant_quotas (tenant_id, resource_key, max_limit, current_usage)
SELECT 
  t.id,
  unnest(ARRAY['maxCustomers', 'maxInventory']),
  unnest(ARRAY[100, 500]),
  0
FROM public.tenants t
WHERE t.name = 'Mi Organización'
ON CONFLICT (tenant_id, resource_key) DO NOTHING
RETURNING tenant_id, resource_key, max_limit;

-- PASO 5: Verificación final
SELECT 
  u.id as user_id,
  u.email,
  u.raw_app_meta_data->>'tenant_id' as tenant_id_meta,
  p.tenant_id as profile_tenant_id,
  t.name as tenant_name,
  t.plan,
  t.industry_type,
  CASE 
    WHEN u.raw_app_meta_data->>'tenant_id' IS NOT NULL 
      AND p.tenant_id IS NOT NULL 
    THEN '✅ REPARADO'
    ELSE '❌ FALLA'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE u.email = 'ghostsnake27@gmail.com';

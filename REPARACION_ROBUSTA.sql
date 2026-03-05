-- ============================================================================
-- DIAGNÓSTICO Y REPARACIÓN ROBUSTA
-- ============================================================================

-- DIAGNÓSTICO 1: ¿Existen tenants?
SELECT id, name, plan, industry_type, created_at 
FROM public.tenants 
ORDER BY created_at DESC
LIMIT 5;

-- Si hay tenants arriba, ANOTA EL ID y ve directo al BLOQUE 2
-- Si NO hay tenants, continúa al BLOQUE 1

-- ============================================================================
-- BLOQUE 1: CREAR TENANT (Solo si no hay tenants)
-- ============================================================================
/*
INSERT INTO public.tenants (name, plan, industry_type)
VALUES ('Mi Organización', 'professional', 'taller')
RETURNING id, name, plan, industry_type;

-- ANOTA EL ID QUE RETORNA
*/

-- ============================================================================
-- BLOQUE 2: ASIGNAR TENANT AL USUARIO
-- ============================================================================
-- REEMPLAZA '<TENANT_ID_AQUI>' con el ID del tenant (del diagnóstico o del insert)

-- Paso 1: Actualizar auth.users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'tenant_id', '<TENANT_ID_AQUI>'::uuid
)
WHERE email = 'ghostsnake27@gmail.com'
RETURNING id, email, raw_app_meta_data->>'tenant_id' as tenant_id;

-- Paso 2: Actualizar profiles
UPDATE public.profiles
SET tenant_id = '<TENANT_ID_AQUI>'::uuid
WHERE id = (SELECT id FROM auth.users WHERE email = 'ghostsnake27@gmail.com')
RETURNING id, tenant_id;

-- Paso 3: Inicializar quotas
INSERT INTO public.tenant_quotas (tenant_id, resource_key, max_limit, current_usage)
VALUES 
  ('<TENANT_ID_AQUI>'::uuid, 'maxCustomers', 100, 0),
  ('<TENANT_ID_AQUI>'::uuid, 'maxInventory', 500, 0)
ON CONFLICT (tenant_id, resource_key) DO NOTHING
RETURNING resource_key, max_limit;

-- Paso 4: VERIFICACIÓN FINAL
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

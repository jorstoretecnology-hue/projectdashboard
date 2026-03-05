-- ============================================================================
-- REPARACIÓN MANUAL SIMPLIFICADA: Asignar Tenant ID (Paso a Paso)
-- ============================================================================
-- Ejecutar LÍNEA POR LÍNEA para ver resultados de cada paso

-- ====================
-- PASO 1: Verificar tenants existentes
-- ====================
SELECT id, name, plan, created_at 
FROM public.tenants 
ORDER BY created_at DESC;

-- Si hay tenants → Anota el ID del que quieres usar
-- Si NO hay tenants → Ejecuta PASO 2


-- ====================
-- PASO 2: Crear tenant si no existe (OPCIONAL)
-- ====================
-- Solo ejecutar si NO hay tenants en PASO 1
INSERT INTO public.tenants (name, plan)
VALUES ('Mi Organización', 'standard')
RETURNING id, name, plan;

-- ANOTA EL ID QUE DEVUELVE (ejemplo: a1b2c3d4-e5f6-...)


-- ====================
-- PASO 3: Asignar tenant al usuario en auth.users
-- ====================
-- REEMPLAZA 'PEGA_AQUI_TENANT_ID' con el ID del tenant del PASO 1 o 2

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'tenant_id', 'PEGA_AQUI_TENANT_ID'::uuid
)
WHERE email = 'ghostsnake27@gmail.com'
RETURNING 
  id, 
  email, 
  raw_app_meta_data->>'tenant_id' as tenant_id_actualizado;


-- ====================
-- PASO 4: Asignar tenant al perfil
-- ====================
-- REEMPLAZA 'PEGA_AQUI_TENANT_ID' con el mismo ID del PASO 3

UPDATE public.profiles
SET tenant_id = 'PEGA_AQUI_TENANT_ID'::uuid
WHERE id = (SELECT id FROM auth.users WHERE email = 'ghostsnake27@gmail.com')
RETURNING 
  id, 
  full_name, 
  tenant_id as tenant_id_actualizado;


-- ====================
-- PASO 5: Inicializar quotas
-- ====================
-- REEMPLAZA 'PEGA_AQUI_TENANT_ID' con el mismo ID

INSERT INTO public.tenant_quotas (tenant_id, resource_key, max_limit, current_usage)
VALUES 
  ('PEGA_AQUI_TENANT_ID'::uuid, 'maxCustomers', 100, 0),
  ('PEGA_AQUI_TENANT_ID'::uuid, 'maxInventory', 500, 0)
ON CONFLICT (tenant_id, resource_key) DO NOTHING
RETURNING tenant_id, resource_key, max_limit;


-- ====================
-- PASO 6: VERIFICACIÓN FINAL
-- ====================
SELECT 
  u.id as user_id,
  u.email,
  u.raw_app_meta_data->>'tenant_id' as tenant_id_meta,
  p.tenant_id as profile_tenant_id,
  t.name as tenant_name,
  t.plan,
  CASE 
    WHEN u.raw_app_meta_data->>'tenant_id' IS NOT NULL 
      AND p.tenant_id IS NOT NULL 
    THEN '✅ REPARADO'
    ELSE '❌ FALTA ALGO'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE u.email = 'ghostsnake27@gmail.com';

-- RESULTADO ESPERADO:
-- - tenant_id_meta: debe ser un UUID (no NULL)
-- - profile_tenant_id: debe ser el mismo UUID
-- - tenant_name: "Mi Organización" (o el nombre que hayas usado)
-- - estado: "✅ REPARADO"

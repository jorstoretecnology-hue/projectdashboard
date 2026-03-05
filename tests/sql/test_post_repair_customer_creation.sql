-- ============================================================================
-- TEST POST-REPARACIÓN: Validar Creación de Cliente
-- ============================================================================
-- Ejecutar DESPUÉS de aplicar REPARACION_TENANT_ID.sql

-- Verificar que el usuario ahora tiene tenant_id
SELECT 
  u.id as user_id,
  u.email,
  u.raw_app_meta_data->>'tenant_id' as tenant_id_meta,
  p.tenant_id as profile_tenant_id,
  t.name as tenant_name,
  CASE 
    WHEN u.raw_app_meta_data->>'tenant_id' IS NOT NULL 
      AND p.tenant_id IS NOT NULL 
    THEN '✅ REPARADO'
    ELSE '❌ FALLA PERSISTE'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE u.email = 'ghostsnake27@gmail.com';

-- Intentar crear un cliente de prueba
-- NOTA: Reemplaza <TENANT_ID> con el tenant_id del usuario
INSERT INTO public.customers (
  first_name,
  last_name,
  email,
  phone,
  status,
  tenant_id
) VALUES (
  'Test',
  'Reparación',
  'test.reparacion@example.com',
  '+57300123456',
  'active',
  (SELECT tenant_id FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'ghostsnake27@gmail.com'))
)
RETURNING id, first_name, last_name, email, tenant_id, created_at;

-- Si el INSERT funciona, la reparación fue exitosa ✅
-- Si falla, revisar el mensaje de error específico

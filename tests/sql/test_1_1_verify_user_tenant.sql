-- ============================================================================
-- TEST 1.1: Verificar Tenant del Usuario
-- ============================================================================
-- Ejecutar este script en Supabase SQL Editor para diagnosticar el problema

-- Verificar estado del usuario
SELECT 
  id, 
  email, 
  raw_app_meta_data->>'tenant_id' as tenant_id_meta,
  raw_app_meta_data->>'app_role' as app_role,
  raw_app_meta_data as full_metadata,
  created_at
FROM auth.users 
WHERE email = 'ghostsnake27@gmail.com';

-- Resultado Esperado:
-- - tenant_id_meta debe ser un UUID válido, NO NULL
-- - app_role debe ser 'USER' o similar
-- Si tenant_id_meta es NULL, el problema está aquí

COMMENT ON TABLE auth.users IS 'Test 1.1: Verificar metadata del usuario';

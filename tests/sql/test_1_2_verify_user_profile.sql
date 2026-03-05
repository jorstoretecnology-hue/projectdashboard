-- ============================================================================
-- TEST 1.2: Verificar Profile del Usuario
-- ============================================================================

SELECT 
  id,
  full_name,
  app_role,
  tenant_id,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'ghostsnake27@gmail.com');

-- Resultado Esperado:
-- - tenant_id debe ser un UUID válido, NO NULL
-- - app_role debe ser 'user' (lowercase) por defecto

COMMENT ON TABLE public.profiles IS 'Test 1.2: Verificar profile del usuario';

-- =============================================================================
-- PARCHE DE EMERGENCIA (FINAL): ACTIVAR MÓDULOS DE "TALLER 1"
-- =============================================================================

-- 1. Activar módulos en la tabla tenants
UPDATE public.tenants 
SET active_modules = ARRAY['Dashboard', 'Inventory', 'Customers', 'Settings', 'Billing']
WHERE name = 'Taller 1';

-- 2. Asegurar rol OWNER en la tabla profiles
-- Usamos una subconsulta porque profiles no tiene columna email, pero auth.users sí.
UPDATE public.profiles
SET app_role = 'OWNER'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'ghostsnake27@gmail.com'
);

COMMENT ON TABLE profiles IS 'Parche aplicado vinculando OWNER via auth.users email subquery.';

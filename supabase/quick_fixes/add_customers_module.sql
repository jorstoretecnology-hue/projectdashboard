-- ============================================================================
-- FIX RAPIDO: Agregar módulo "Customers" a todos los tenants
-- ============================================================================

-- 1. Agregar "Customers" a active_modules de todos los tenants
UPDATE tenants 
SET active_modules = array_append(active_modules, 'Customers')
WHERE NOT ('Customers' = ANY(active_modules));

-- 2. Verificar que se agregó correctamente
SELECT id, name, plan, active_modules
FROM tenants
ORDER BY name;

-- 3. Resultado esperado: Todos los tenants deben tener 'Customers' en active_modules

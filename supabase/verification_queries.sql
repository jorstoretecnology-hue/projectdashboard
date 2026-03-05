-- ============================================================================
-- QUERIES DE VERIFICACION POST-MIGRACION
-- ============================================================================
-- Ejecuta estas queries en el SQL Editor de Supabase para verificar
-- que la migración se completó correctamente
-- ============================================================================

-- 1. VERIFICAR TABLAS CREADAS
-- ============================================================================
-- Debe mostrar 7 tablas: audit_logs, customers, inventory_items, products, profiles, tenant_quotas, tenants

SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFICAR ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Todas las tablas deben tener rowsecurity = true

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================================
-- 3. VERIFICAR FUNCIONES CREADAS
-- ============================================================================
-- Debe mostrar 7 funciones

SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================================================
-- 4. VERIFICAR TRIGGERS
-- ============================================================================
-- Debe mostrar múltiples triggers

SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 5. VERIFICAR DATOS DE EJEMPLO (TENANTS)
-- ============================================================================
-- Debe mostrar 5 tenants

SELECT id, name, plan, industry_type, is_active
FROM tenants 
ORDER BY name;

-- ============================================================================
-- 6. VERIFICAR ESTRUCTURA DE TENANTS
-- ============================================================================
-- Debe mostrar todas las columnas incluyendo: name, active_modules, branding, feature_flags

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tenants'
ORDER BY ordinal_position;

-- ============================================================================
-- 7. VERIFICAR POLITICAS RLS
-- ============================================================================
-- Debe mostrar múltiples políticas

SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 8. CONTAR REGISTROS EN CADA TABLA
-- ============================================================================

SELECT 
  'tenants' as tabla, COUNT(*) as registros FROM tenants
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items
UNION ALL
SELECT 'tenant_quotas', COUNT(*) FROM tenant_quotas
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'products', COUNT(*) FROM products
ORDER BY tabla;

-- ============================================================================
-- 9. VERIFICAR FEATURE FLAGS EN TENANTS
-- ============================================================================
-- Todos los tenants deben tener feature_flags poblados

SELECT name, plan, feature_flags, active_modules
FROM tenants
ORDER BY plan DESC, name;

-- ============================================================================
-- 10. VERIFICAR INDICES
-- ============================================================================

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- RESUMEN RAPIDO
-- ============================================================================
-- Ejecuta esta query para un resumen completo

SELECT 
  'Tablas creadas' as verificacion,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public')::text as resultado,
  '7' as esperado
UNION ALL
SELECT 
  'Tablas con RLS',
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)::text,
  '7'
UNION ALL
SELECT 
  'Funciones creadas',
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION')::text,
  '7'
UNION ALL
SELECT 
  'Tenants de ejemplo',
  (SELECT COUNT(*)::text FROM tenants),
  '5'
UNION ALL
SELECT 
  'Políticas RLS',
  (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public'),
  '15+'
ORDER BY verificacion;

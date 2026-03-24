-- ============================================================
-- Fase 1: Índices y Claves Foráneas Faltantes
-- ============================================================
-- Propósito: Garantizar integridad referencial y optimizar RLS
-- Riesgo: MEDIO (puede fallar si hay datos huérfanos)
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: Detección de Datos Huérfanos (DRY-RUN)
-- ============================================================
-- NOTA PARA EL USUARIO: Ejecuta estas queries ANTES de aplicar las FKs
-- Si hay resultados, debes limpiar los datos huérfanos primero

-- 1.1 Huérfanos en inventory_items (sin producto)
-- OMITIDO: inventory_items no tiene product_id en la base de datos remota

-- 1.2 Huérfanos en inventory_movements (sin producto)
SELECT 
    im.id, 
    im.product_id, 
    im.tenant_id,
    im.quantity
FROM inventory_movements im
LEFT JOIN products p ON p.id = im.product_id
WHERE p.id IS NULL
  AND im.product_id IS NOT NULL;

-- 1.3 Huérfanos en sale_items (sin producto)
SELECT 
    si.id, 
    si.product_id, 
    si.quantity
FROM sale_items si
LEFT JOIN products p ON p.id = si.product_id
WHERE p.id IS NULL
  AND si.product_id IS NOT NULL;

-- 1.4 Huérfanos en sales (sin cliente)
SELECT 
    s.id, 
    s.customer_id, 
    s.tenant_id,
    s.total
FROM sales s
LEFT JOIN customers c ON c.id = s.customer_id
WHERE c.id IS NULL
  AND s.customer_id IS NOT NULL;

-- ============================================================
-- PASO 2: Limpieza de Datos Huérfanos (OPCIONAL)
-- ============================================================
-- SOLO EJECUTAR SI LAS QUERIES ANTERIORES DEVOLVIERON RESULTADOS
-- Descomenta las siguientes líneas según necesites

-- -- Eliminar inventory_items sin producto
-- DELETE FROM inventory_items
-- WHERE product_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM products WHERE id = inventory_items.product_id);

-- -- Eliminar inventory_movements sin producto
-- DELETE FROM inventory_movements
-- WHERE product_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM products WHERE id = inventory_movements.product_id);

-- -- Eliminar sale_items sin producto
-- DELETE FROM sale_items
-- WHERE product_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM products WHERE id = sale_items.product_id);

-- -- Eliminar sales sin cliente
-- DELETE FROM sales
-- WHERE customer_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM customers WHERE id = sales.customer_id);

-- ============================================================
-- PASO 3: Creación de Foreign Keys (FKs)
-- ============================================================

-- 3.1 FK en inventory_items -> products
-- OMITIDO: La tabla inventory_items no tiene product_id en este diseño.

-- 3.2 FK en inventory_movements → products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'inventory_movements_product_id_fkey'
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE inventory_movements
        ADD CONSTRAINT inventory_movements_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE;
        RAISE NOTICE 'FK creada: inventory_movements_product_id_fkey';
    ELSE
        RAISE NOTICE 'FK ya existe: inventory_movements_product_id_fkey';
    END IF;
END $$;

-- 3.3 FK en sale_items → products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'sale_items_product_id_fkey'
        AND table_name = 'sale_items'
    ) THEN
        ALTER TABLE sale_items
        ADD CONSTRAINT sale_items_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE;
        RAISE NOTICE 'FK creada: sale_items_product_id_fkey';
    ELSE
        RAISE NOTICE 'FK ya existe: sale_items_product_id_fkey';
    END IF;
END $$;

-- 3.4 FK en sales → customers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'sales_customer_id_fkey'
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT;
        RAISE NOTICE 'FK creada: sales_customer_id_fkey';
    ELSE
        RAISE NOTICE 'FK ya existe: sales_customer_id_fkey';
    END IF;
END $$;

-- ============================================================
-- PASO 4: Creación de Índices para Rendimiento (RLS + Queries)
-- ============================================================

-- 4.1 Índices simples para FKs (si no existen)
-- OMITIDO: idx_inventory_items_product_id (columna no existe)

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id 
ON inventory_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_product_id 
ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_sales_customer_id 
ON sales(customer_id);

-- 4.2 Índices compuestos encabezados por tenant_id (CRÍTICO para RLS)
-- OMITIDO: idx_inventory_items_tenant_product (columna no existe)

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_product 
ON inventory_movements(tenant_id, product_id);

-- OMITIDO: idx_sale_items_tenant_product porque sale_items no tiene tenant_id

CREATE INDEX IF NOT EXISTS idx_sales_tenant_customer 
ON sales(tenant_id, customer_id);

-- 4.3 Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_email 
ON customers(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_products_tenant_sku 
ON products(tenant_id, sku);

CREATE INDEX IF NOT EXISTS idx_products_tenant_name 
ON products(tenant_id, name);

-- 4.4 Índices para estados y fechas (reportes y filtros)
CREATE INDEX IF NOT EXISTS idx_sales_tenant_state 
ON sales(tenant_id, state);

CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at 
ON sales(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_stock 
ON inventory_items(tenant_id, stock);

-- ============================================================
-- PASO 5: Verificación Post-Migración
-- ============================================================

-- 5.1 Verificar FKs creadas
SELECT 
    tc.table_name AS tabla,
    kcu.column_name AS columna,
    ccu.table_name AS tabla_referencia,
    ccu.column_name AS columna_referencia,
    rc.delete_rule AS regla_delete
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('inventory_items', 'inventory_movements', 'sale_items', 'sales')
ORDER BY tc.table_name, kcu.column_name;

-- 5.2 Verificar índices creados
SELECT 
    tablename AS tabla,
    indexname AS indice,
    indexdef AS definicion
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('inventory_items', 'inventory_movements', 'sale_items', 'sales', 'customers', 'products')
ORDER BY tablename, indexname;

-- 5.3 Contar índices por tenant_id
SELECT 
    COUNT(*) AS total_indices_tenant_id,
    STRING_AGG(indexname, ', ') AS nombres
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%tenant_id%';

-- ============================================================
-- PASO 6: Resumen de Cambios
-- ============================================================

DO $$
DECLARE
    v_fks_created INTEGER;
    v_indices_created INTEGER;
BEGIN
    -- Contar FKs nuevas
    SELECT COUNT(*) INTO v_fks_created
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name IN ('inventory_items', 'inventory_movements', 'sale_items', 'sales');

    -- Contar índices nuevos
    SELECT COUNT(*) INTO v_indices_created
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('inventory_items', 'inventory_movements', 'sale_items', 'sales', 'customers', 'products');

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FASE 1 COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Foreign Keys activas: %', v_fks_created;
    RAISE NOTICE 'Índices creados: %', v_indices_created;
    RAISE NOTICE '==========================================';
END $$;

COMMIT;

-- ============================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================================
-- 1. ✅ Verifica que no haya errores en la consola
-- 2. ✅ Revisa los resultados del PASO 5 (FKs e índices)
-- 3. ✅ Ejecuta tests en el frontend: npm test
-- 4. ✅ Verifica que las queries con RLS funcionen correctamente
-- 5. ✅ Reporta éxito en #security-pipeline
-- ============================================================

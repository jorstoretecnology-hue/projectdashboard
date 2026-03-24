---
trigger: on_file_change
glob: "**/*.sql"
description: Reglas para migraciones y operaciones de base de datos
---

# 🗄️ Reglas para Base de Datos y Migraciones SQL

## Principios de Diseño

### 1. Aislamiento Multi-Tenant (CRÍTICO)

**Todas las tablas operativas DEBEN tener:**
- Columna `tenant_id UUID NOT NULL`
- Foreign key a `tenants(id)` con `ON DELETE CASCADE`
- Política RLS de aislamiento

```sql
-- ✅ CORRECTO
CREATE TABLE public.customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_tenant_isolation"
ON public.customers FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());
```

---

### 2. Índices de Performance (ALTO)

**Índices obligatorios:**
- `tenant_id` en todas las tablas operativas
- Columnas usadas en `WHERE` frecuentemente
- Columnas usadas en `JOIN`
- Índices compuestos para queries comunes

```sql
-- ✅ CORRECTO - Índices esenciales
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_name 
    ON public.customers(tenant_id, first_name, last_name);

-- Índice parcial para registros activos
CREATE INDEX IF NOT EXISTS idx_customers_active 
    ON public.customers(tenant_id, created_at) 
    WHERE deleted_at IS NULL;
```

---

### 3. Soft Delete (ALTO)

**Tablas de negocio deben soportar borrado lógico:**

```sql
-- ✅ CORRECTO - Soft delete
ALTER TABLE public.customers 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

### 4. Auditoría Automática (ALTO)

**Trigger para audit logs:**

```sql
-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID,
    action          TEXT NOT NULL, -- CREATE, UPDATE, DELETE
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Trigger function genérico
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (tenant_id, user_id, action, entity_type, entity_id, new_values)
        VALUES (NEW.tenant_id, auth.uid(), 'CREATE', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (NEW.tenant_id, auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_values)
        VALUES (OLD.tenant_id, auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();
```

---

### 5. Validación de Datos (MEDIO)

**Constraints para integridad:**

```sql
-- ✅ CORRECTO - Constraints de validación
ALTER TABLE public.customers 
    ADD CONSTRAINT customers_email_format 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.products 
    ADD CONSTRAINT products_price_positive 
    CHECK (price >= 0);

ALTER TABLE public.sales 
    ADD CONSTRAINT sales_total_non_negative 
    CHECK (total_amount >= 0);

-- Enums para valores discretos
ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_app_role_check 
    CHECK (app_role IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));
```

---

## Migraciones

### Estructura de Archivo de Migración

```sql
-- Migration: description_of_change
-- Date: YYYY-MM-DD
-- Author: name
-- Jira: PROJECT-123 (si aplica)

BEGIN;

-- 1. Crear/Alter tabla
CREATE TABLE IF NOT EXISTS public.table_name (
    -- columnas
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_table_column ON public.table_name(column);

-- 3. Habilitar RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
CREATE POLICY "table_tenant_isolation"
ON public.table_name FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- 5. Crear triggers
CREATE TRIGGER update_table_updated_at
    BEFORE UPDATE ON public.table_name
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Migrar datos existentes (si aplica)
INSERT INTO public.new_table (id, tenant_id, data)
SELECT id, tenant_id, data FROM public.old_table;

-- 7. Grants de permisos (si aplica)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.table_name TO authenticated;

COMMIT;

-- Rollback (comentarios para referencia)
-- BEGIN;
-- DROP TRIGGER IF EXISTS update_table_updated_at ON public.table_name;
-- DROP POLICY IF EXISTS "table_tenant_isolation" ON public.table_name;
-- DROP INDEX IF EXISTS idx_table_column;
-- DROP TABLE IF EXISTS public.table_name;
-- COMMIT;
```

---

## Funciones y RPCs

### Funciones SECURITY DEFINER

```sql
-- ✅ CORRECTO - Función segura
CREATE OR REPLACE FUNCTION public.get_required_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Obtener tenant_id del perfil del usuario
    SELECT tenant_id INTO v_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuario sin tenant asignado';
    END IF;
    
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grants
REVOKE ALL ON FUNCTION public.get_required_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_required_tenant_id() TO authenticated;
```

### Funciones Helper para RLS

```sql
-- Helper para obtener tenant_id actual
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper para obtener location_ids accesibles
CREATE OR REPLACE FUNCTION public.get_user_location_ids()
RETURNS UUID[] AS $$
    SELECT COALESCE(
        ARRAY_AGG(DISTINCT ul.location_id),
        ARRAY[]::UUID[]
    )
    FROM public.user_locations ul
    WHERE ul.user_id = auth.uid()
      AND ul.is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper para obtener sibling locations
CREATE OR REPLACE FUNCTION public.get_sibling_location_ids(p_location_id UUID)
RETURNS UUID[] AS $$
    SELECT COALESCE(
        ARRAY_AGG(DISTINCT l.id),
        ARRAY[]::UUID[]
    )
    FROM public.locations l
    WHERE l.tenant_id = (
        SELECT tenant_id FROM public.locations WHERE id = p_location_id
    )
    AND l.is_active = true
    AND l.deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## Políticas RLS

### Plantillas de Políticas

```sql
-- 1. Aislamiento por tenant (estándar)
CREATE POLICY "table_tenant_isolation"
ON public.table_name FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- 2. Solo lectura para usuarios autenticados
CREATE POLICY "table_authenticated_read"
ON public.table_name FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- 3. Escritura solo para ADMIN/OWNER
CREATE POLICY "table_admin_write"
ON public.table_name FOR ALL
USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
        SELECT 1 FROM public.user_locations ul
        WHERE ul.user_id = auth.uid()
          AND ul.role IN ('OWNER', 'ADMIN')
          AND ul.is_active = true
    )
);

-- 4. Solo el dueño del recurso
CREATE POLICY "table_owner_only"
ON public.table_name FOR ALL
USING (user_id = auth.uid());

-- 5. SuperAdmin access con logging
CREATE POLICY "table_superadmin_access"
ON public.table_name FOR ALL
TO authenticated
USING (
    tenant_id = get_current_user_tenant_id()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND app_role = 'SUPER_ADMIN'
    )
);
```

---

## Queries Seguras

### Patrones de Query

```sql
-- ✅ CORRECTO - Query con RLS y campos explícitos
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.created_at
FROM public.customers c
WHERE c.tenant_id = get_current_user_tenant_id()
  AND c.deleted_at IS NULL
ORDER BY c.created_at DESC
LIMIT 100;

-- ✅ CORRECTO - Join con verificación de tenant
SELECT 
    s.id,
    s.total_amount,
    s.created_at,
    c.first_name,
    c.last_name
FROM public.sales s
JOIN public.customers c ON c.id = s.customer_id
WHERE s.tenant_id = get_current_user_tenant_id()
  AND c.tenant_id = get_current_user_tenant_id() -- Doble verificación
  AND s.deleted_at IS NULL
ORDER BY s.created_at DESC
LIMIT 50;

-- ✅ CORRECTO - Subquery con RLS
SELECT *
FROM public.products p
WHERE p.tenant_id = get_current_user_tenant_id()
  AND p.stock > 0
  AND EXISTS (
      SELECT 1 FROM public.categories cat
      WHERE cat.id = p.category_id
        AND cat.tenant_id = get_current_user_tenant_id()
  )
ORDER BY p.name;
```

---

## Performance

### Optimización de Queries

```sql
-- ✅ CORRECTO - EXPLAIN ANALYZE para debug
EXPLAIN ANALYZE
SELECT c.id, c.first_name, c.email
FROM public.customers c
WHERE c.tenant_id = 'uuid-here'
  AND c.deleted_at IS NULL
ORDER BY c.created_at DESC
LIMIT 100;

-- Resultado esperado:
-- Index Scan using idx_customers_tenant on customers
--   Index Cond: (tenant_id = 'uuid-here'::uuid)
--   Filter: (deleted_at IS NULL)

-- ✅ CORRECTO - Índice compuesto para query común
CREATE INDEX IF NOT EXISTS idx_customers_tenant_created
    ON public.customers(tenant_id, created_at DESC)
    WHERE deleted_at IS NULL;
```

### Evitar N+1 Queries

```sql
-- ❌ PROHIBIDO - N+1 query pattern
-- (Esto se hace en código, pero evitar como patrón)
SELECT id FROM customers WHERE tenant_id = 'uuid';
-- Luego para cada customer:
SELECT * FROM orders WHERE customer_id = ?;

-- ✅ CORRECTO - Single query con JOIN
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    ARRAY_AGG(o.id) AS order_ids,
    ARRAY_AGG(o.total_amount) AS order_totals
FROM public.customers c
LEFT JOIN public.orders o ON o.customer_id = c.id
WHERE c.tenant_id = get_current_user_tenant_id()
  AND c.deleted_at IS NULL
GROUP BY c.id, c.first_name, c.last_name;
```

---

## Backup y Recovery

### Backup Automático

```sql
-- pg_cron job para backup diario (Supabase)
SELECT cron.schedule(
    'daily-backup',
    '0 3 * * *', -- 3 AM UTC daily
    $$SELECT pg_backup_database('backup', '/backups/backup_' || to_char(now(), 'YYYYMMDD') || '.sql')$$
);

-- Verificar jobs programados
SELECT * FROM cron.job;
```

### Retención de Datos

```sql
-- pg_cron job para purga de logs antiguos
SELECT cron.schedule(
    'purge-old-logs',
    '0 4 * * *', -- 4 AM UTC daily
    $$
    -- Purge webhook_logs > 90 días
    DELETE FROM public.webhook_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Purge audit_logs operacionales > 365 días
    DELETE FROM public.audit_logs 
    WHERE created_at < NOW() - INTERVAL '365 days'
      AND action NOT IN ('PLAN_CHANGE', 'TENANT_SUSPEND', 'TENANT_REACTIVATE');
    $$
);
```

---

## Monitoreo

### Queries de Monitoreo

```sql
-- Verificar tamaño de tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar índices no usados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan < 100
ORDER BY idx_scan;

-- Verificar locks activos
SELECT 
    pid,
    usename,
    query,
    state,
    wait_event_type,
    wait_event,
    age(now(), query_start) AS duration
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Verificar RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Checklist de Migración

### Antes de Ejecutar

- [ ] Migración probada en entorno local
- [ ] Migración probada en staging
- [ ] Rollback probado y funcional
- [ ] Backup de producción verificado
- [ ] Impacto en performance evaluado
- [ ] RLS policies definidas
- [ ] Índices creados
- [ ] Documentación actualizada

### Durante la Ejecución

- [ ] Ejecutar en ventana de bajo tráfico
- [ ] Monitorear locks y performance
- [ ] Tener rollback listo
- [ ] Notificar al equipo

### Después de Ejecutar

- [ ] Verificar que la migración aplicó
- [ ] Ejecutar tests de integración
- [ ] Verificar que no hay errores en logs
- [ ] Monitorear métricas de performance
- [ ] Actualizar documentación
- [ ] Eliminar código legacy (si aplica)

---

## Referencias

- [DATABASE_SCHEMA.md](../docs/technical/DATABASE_SCHEMA.md)
- [SECURITY_CHECKLIST.md](../docs/security/SECURITY_CHECKLIST.md)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Best_practices)

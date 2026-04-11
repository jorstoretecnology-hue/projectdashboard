---
name: database-design
description: >
  Diseño profesional de bases de datos, migraciones SQL, RLS (Row Level Security),
  funciones y triggers en Supabase/PostgreSQL. Usar cuando el usuario quiera:
  crear tablas, modificar schema, escribir migraciones, definir políticas RLS,
  crear funciones SQL, optimizar queries, diseñar relaciones entre tablas,
  o resolver errores de base de datos. Activar con: tabla, migración, SQL,
  schema, RLS, query, índice, foreign key, trigger, función RPC, Supabase.
---

# Base de Datos y Migraciones

## Principios fundamentales

1. **Nunca modificar producción directamente** — siempre crear migración
2. **RLS en todas las tablas** — deny by default
3. **Nunca select('*')** — especificar columnas siempre
4. **Siempre límite en queries de lista** — nunca retornar filas ilimitadas
5. **Transacciones para operaciones múltiples** — o todas o ninguna
6. **Soft delete con `deleted_at`** — nunca borrar datos permanentemente

---

## Estructura de migraciones

### Naming convention
```
YYYYMMDD000000_descripcion_corta.sql
Ejemplo: 20260315000001_add_pricing_by_industry.sql
```

### Template de migración
```sql
-- ============================================================
-- Migración: [descripción]
-- Fecha: YYYY-MM-DD
-- Autor: [nombre o agente]
-- ============================================================

-- 1. CAMBIOS DE SCHEMA
-- (CREATE TABLE, ALTER TABLE, etc.)

-- 2. FUNCIONES Y TRIGGERS
-- (CREATE OR REPLACE FUNCTION, CREATE TRIGGER)

-- 3. POLÍTICAS RLS
-- (ALTER TABLE ENABLE ROW LEVEL SECURITY, CREATE POLICY)

-- 4. DATOS INICIALES
-- (INSERT INTO)

-- 5. VERIFICACIÓN
-- (SELECT para confirmar que quedó bien)
```

---

## Diseño de tablas

### Template de tabla multi-tenant
```sql
CREATE TABLE public.nombre_tabla (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id),
  -- campos específicos aquí
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ  -- soft delete
);

-- Índices
CREATE INDEX idx_nombre_tabla_tenant ON public.nombre_tabla(tenant_id);
CREATE INDEX idx_nombre_tabla_deleted ON public.nombre_tabla(deleted_at) 
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.nombre_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nombre_tabla_tenant_isolation"
ON public.nombre_tabla FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- Trigger updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.nombre_tabla
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### Tipos de datos recomendados

| Caso de uso | Tipo PostgreSQL |
|-------------|----------------|
| IDs | UUID con gen_random_uuid() |
| Precios en COP | INTEGER (nunca FLOAT) |
| Precios con decimales | NUMERIC(10,2) |
| Fechas con timezone | TIMESTAMPTZ |
| JSON flexible | JSONB |
| Textos cortos | VARCHAR(255) |
| Textos largos | TEXT |
| Estados/enums | TEXT con CHECK constraint |
| Arrays | TEXT[] o UUID[] |

---

## Row Level Security (RLS)

### Función base obligatoria
```sql
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
DECLARE v_tenant_id UUID;
BEGIN
  -- Primero del JWT (rápido)
  v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
  -- Fallback a profiles si el JWT no tiene el claim
  IF v_tenant_id IS NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  END IF;
  RETURN v_tenant_id;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Políticas por tipo de acceso

```sql
-- Tenant isolation básica (más común)
CREATE POLICY "tabla_tenant_isolation" ON public.tabla FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- Solo lectura pública (precios, catálogos)
CREATE POLICY "tabla_public_read" ON public.tabla FOR SELECT
USING (true);

-- Super admin ve todo
CREATE POLICY "tabla_superadmin_all" ON public.tabla FOR ALL
USING (
  (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'SUPER_ADMIN'
);

-- Por rol dentro del tenant
CREATE POLICY "tabla_owner_only" ON public.tabla FOR DELETE
USING (
  tenant_id = get_current_user_tenant_id()
  AND (auth.jwt() -> 'app_metadata' ->> 'app_role') IN ('OWNER', 'ADMIN')
);
```

---

## Queries en Supabase

### Patrones correctos

```typescript
// ✅ CORRECTO — especificar columnas, límite, manejo de error
const { data, error } = await supabase
  .from('products')
  .select('id, name, price, stock, sku')
  .eq('tenant_id', tenantId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(50)

if (error) throw new Error(error.message)

// ❌ INCORRECTO — select(*), sin límite, sin manejo de error
const { data } = await supabase.from('products').select('*')
```

### Anti-patrones a evitar

```typescript
// ❌ Query dentro de loop (N+1 queries)
for (const sale of sales) {
  const { data } = await supabase
    .from('customers')
    .select('name')
    .eq('id', sale.customer_id)
    .single()
}

// ✅ Un solo query con join
const { data } = await supabase
  .from('sales')
  .select('id, total, customers(name)')
  .in('id', saleIds)
```

### RPCs para operaciones complejas
```typescript
// Usar RPC cuando la operación afecta múltiples tablas
const { data, error } = await supabase.rpc('activate_modules_for_tenant', {
  p_tenant_id: tenantId,
  p_plan_slug: 'professional'
})
```

---

## Funciones SQL

### Template de función segura
```sql
CREATE OR REPLACE FUNCTION nombre_funcion(
  p_param1 UUID,
  p_param2 TEXT DEFAULT NULL
)
RETURNS tipo_retorno AS $$
DECLARE
  v_variable tipo;
BEGIN
  -- Validaciones primero
  IF p_param1 IS NULL THEN
    RAISE EXCEPTION 'param1 es requerido';
  END IF;

  -- Lógica principal

  RETURN v_variable;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error en nombre_funcion: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Índices

### Cuándo crear índices
- Columnas usadas en WHERE frecuentemente
- Foreign keys (Supabase no los crea automáticamente)
- Columnas de ordenamiento frecuente
- Columnas de búsqueda de texto

```sql
-- Foreign key
CREATE INDEX idx_tabla_tenant_id ON public.tabla(tenant_id);

-- Soft delete (parcial — solo filas activas)
CREATE INDEX idx_tabla_active ON public.tabla(tenant_id) 
  WHERE deleted_at IS NULL;

-- Búsqueda de texto
CREATE INDEX idx_tabla_name_search ON public.tabla 
  USING gin(to_tsvector('spanish', name));

-- Compuesto
CREATE INDEX idx_tabla_tenant_created ON public.tabla(tenant_id, created_at DESC);
```

---

## Checklist de diseño de tabla

```
Estructura:
[ ] Tiene id UUID con gen_random_uuid()
[ ] Tiene tenant_id si es dato del negocio
[ ] Tiene created_at y updated_at
[ ] Tiene deleted_at si necesita soft delete
[ ] CHECK constraints en campos con valores limitados
[ ] UNIQUE constraints donde aplique

RLS:
[ ] ENABLE ROW LEVEL SECURITY
[ ] Policy de tenant isolation
[ ] Policy de super admin si aplica

Índices:
[ ] Índice en tenant_id
[ ] Índice en foreign keys
[ ] Índice parcial para deleted_at IS NULL

Triggers:
[ ] Trigger de updated_at

Migración:
[ ] Nombre con fecha y descripción
[ ] Query de verificación al final
[ ] Probado en ambiente de desarrollo antes de producción
```

---

## Resolución de errores comunes

| Error | Causa | Solución |
|-------|-------|---------|
| `violates foreign key constraint` | Borrar padre antes que hijo | Borrar en orden correcto |
| `duplicate key value` | Falta ON CONFLICT | Agregar ON CONFLICT DO UPDATE |
| `new row violates row-level security` | Policy muy restrictiva | Revisar USING y WITH CHECK |
| `relation already exists` | Migración corrida dos veces | Usar CREATE IF NOT EXISTS |
| `cannot drop function ... because other objects depend` | Trigger usa la función | DROP TRIGGER primero, luego función |
| `column does not exist` | Nombre de columna incorrecto | Verificar con \d nombre_tabla |
```

---

## 🔐 SUPABASE MULTI-TENANT MASTERY (v5.5.0)

### 1. Row Level Security (RLS) Avanzado

**Regla de Oro:** RLS es tu única defensa contra IDOR.

#### Patrón: Aislamiento por tenant_id
```sql
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_tenant_isolation" ON public.customers
FOR ALL USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());
```

#### Anti-patrones Críticos:
- ❌ **Olvidar RLS en tabla nueva:** Siempre ejecutar `ENABLE ROW LEVEL SECURITY`.
- ❌ **Usar tenant_id del cliente:** El `tenant_id` debe resolverse en el servidor vía `auth.jwt()`.
- ❌ **Olvidar RLS en UPDATE/DELETE:** Las políticas deben cubrir todas las operaciones.

---

### 2. Multi-tenant Query Patterns

**Regla:** Toda query en el servidor DEBE filtrar explícitamente por `tenant_id` incluso con RLS activo (defensa en profundidad).

#### Pattern: Server Action Seguro
```typescript
export async function getCustomers() {
  const supabase = createServerClient()
  const tenantId = await getRequiredTenantId(supabase)

  return supabase
    .from('customers')
    .select('id, name, email') // ← CAMPOS EXPLÍCITOS (NO *)
    .eq('tenant_id', tenantId)  // ← FILTRO MANUAL OBLIGATORIO
}
```

---

### 3. Atomicidad y Race Conditions (RPC)

**Problema:** Operaciones de lectura-luego-escritura (ej: cuotas) fallan bajo carga.

#### Solución: RPC Atómico (INSERT ON CONFLICT)
```sql
CREATE OR REPLACE FUNCTION increment_tenant_quota(
  p_tenant_id UUID,
  p_amount INTEGER = 1
)
RETURNS TABLE (used INTEGER, "limit" INTEGER) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO tenant_quotas (tenant_id, used, "limit")
  VALUES (p_tenant_id, p_amount, 1000)
  ON CONFLICT (tenant_id)
  DO UPDATE SET used = tenant_quotas.used + p_amount
  RETURNING tenant_quotas.used, tenant_quotas.limit;
END;
$$ LANGUAGE plpgsql;
```

---

### 4. PostgreSQL Constraints & Integrity

#### Único por Tenant
```sql
-- SKU único POR EMPRESA, no global
ALTER TABLE products ADD CONSTRAINT products_sku_tenant_unique 
  UNIQUE(tenant_id, sku);
```

#### Foreign Keys con Cascada
```sql
-- Limpieza automática al eliminar un tenant
ALTER TABLE orders ADD CONSTRAINT orders_tenant_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  ON DELETE CASCADE;
```

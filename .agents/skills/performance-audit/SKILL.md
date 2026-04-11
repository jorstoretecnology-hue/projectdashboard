---
name: performance-audit
description: >
  Análisis de performance, optimización de índices y trazabilidad para auditoría
  (SaaS v5.5.0). Usar ante queries lentas o necesidad de trazabilidad de cambios.
---

# Database Performance & Audit Trail

**Por qué es CRÍTICO:**
- **Performance:** Evita table scans en miles de tenants.
- **Audit:** Necesario para integridad legal (Compliance) en las 7 industrias.

## 1. Patrón: Índices Críticos para Multi-tenant

Toda query por `tenant_id` debe estar indexada para ser eficiente:

```sql
-- Índice básico
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);

-- Índice compuesto (Filtro por tenant + Ordenamiento)
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at DESC);

-- Índice parcial (Solo filas activas - optimiza tamaño)
CREATE INDEX idx_products_active ON products(tenant_id) 
WHERE deleted_at IS NULL;
```

## 2. 🛡️ Auditoría Automática (Audit Trail)

Implementación de trazabilidad de cambios para cumplimiento:

```sql
-- Tabla centralizada de auditoría
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID REFERENCES auth.users(id),
  action      VARCHAR(50), -- CREATE, UPDATE, DELETE
  table_name  VARCHAR(100),
  old_values  JSONB,
  new_values  JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger de auditoría (Ejem. para Customers)
CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

## 3. Comandos de Análisis (Debugging de Performance)

Usa estos comandos ante cualquier lentitud reportada:

```sql
-- Ver si la query usa el índice (Index Scan vs Seq Scan)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE tenant_id = '...' ORDER BY created_at DESC;

-- Ver índices actuales en una tabla
SELECT * FROM pg_indexes WHERE tablename = 'orders';
```

## 4. Anti-patrones
- ❌ **Índices excesivos:** Demasiados índices ralentizan los INSERT.
- ❌ **Consultas N+1:** Unir siempre tablas en una sola query con `select('*, table2(*)')`.
- ❌ **Auditar todo:** Solo auditar tablas críticas (Ventas, Ajustes, Inventario).

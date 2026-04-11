---
name: db-migration-best-practices
description: >
  Estrategias de migración zero-downtime y planes de rollback para la base de datos
  PostgreSQL/Supabase. Usar ante cambios estructurales en tablas críticas (v5.5.0).
---

# Safe Database Migrations for Multi-tenant

**Por qué es CRÍTICO:**
- Tu arquitectura maneja datos reales de 7 industrias. Una migración fallida puede paralizar todos los tenants.

## 1. Patrón: Migración Zero-Downtime

Para cambios estructurales, sigue este flujo en lugar de un `ALTER TABLE` directo:

```sql
-- Fase 1: Crear tabla nueva con datos (Backfill)
-- Este paso no bloquea escrituras en la tabla original
CREATE TABLE products_v2 AS SELECT * FROM products;

-- Fase 2: Validar integridad
SELECT COUNT(*) FROM products; -- Debe coincidir con products_v2

-- Fase 3: Triggers de Dual-Write
-- Asegura que los nuevos datos se escriban en ambas tablas durante la transición

-- Fase 4: Rename (El momento del cambio)
BEGIN;
  ALTER TABLE products RENAME TO products_old;
  ALTER TABLE products_v2 RENAME TO products;
COMMIT;
```

## 2. Checklist Pre-migración

- [ ] **Prueba en Staging:** Nunca ejecutar sin probar con un dump de producción.
- [ ] **Backup Manual:** Ejecutar un snapshot de Supabase justo antes.
- [ ] **Timeout 30s:** No permitir que la migración bloquee tablas por más de 30 segundos.
- [ ] **Plan de Rollback:** Documentar el comando exacto para revertir (ej: Rename invertido).

## 3. Anti-patrones a evitar

- ❌ **Ejecutar durante horas pico:** Siempre programar en horas de menor tráfico (.ej: 2 AM).
- ❌ **ALTER TABLE sin validación previa:** Columnas NOT NULL en tablas con datos causarán fallos.

## 4. Comandos de Rollback

```sql
-- En caso de desastre:
ALTER TABLE products RENAME TO products_failed_v2;
ALTER TABLE products_old RENAME TO products;
```

# 🗄️ Plan Definitivo de Optimización de Base de Datos (Data Layer Hardening)

Este documento centraliza las fases de ejecución para optimizar, normalizar y asegurar el rendimiento de la base de datos Supabase en nuestro entorno multi-tenant. Está diseñado para ser ejecutado e iterado colaborativamente entre los agentes (Antigravity / Qwen) y el equipo de desarrollo.

## 🎯 Objetivos Principales
1. **Garantizar la integridad referencial** (Eliminar y prevenir datos huérfanos).
2. **Maximizar el rendimiento de las políticas RLS** mediante indexación obligatoria del `tenant_id`.
3. **Erradicar anti-patrones relacionales** (migración de _Arrays_ a _Tablas de Unión_).
4. **Automatizar la trazabilidad del estado** (`updated_at` manejado por base de datos).

---

## 📋 Fases de Ejecución (✅ TODAS COMPLETADAS EN PRODUCCIÓN)

### Fase 1: Índices y Claves Foráneas Faltantes (Prioridad Crítica / P0) ✅ (COMPLETADO)
**Foco:** Salud estructural y Velocidad.
1. **Detección de Datos Huérfanos:** Ejecutar queries SELECT de validación para `inventory_items`, `inventory_movements`, `sale_items`, `sales`.
2. **Restricciones DDL:** Script SQL transaccional para agregar las Foreign Keys (`REFERENCES products(id) ON DELETE CASCADE`, etc.).
3. **Indexación Estratégica:** `CREATE INDEX` en columnas usadas como FKs (`customer_id`, `location_id`) e índices compuestos encabezados por el `tenant_id` (`[tenant_id, email]`, `[tenant_id, sku]`).

### Fase 2: Normalización de Módulos a Tablas Relacionales (Prioridad Alta / P1) ✅ (COMPLETADO)
**Foco:** Refactorización sin pérdida de datos.
1. **Creación de Estructuras:** Crear tablas `tenant_modules` y `plan_modules`.
2. **Sincronización de Datos:** Migración en la misma transacción desde `tenants.active_modules` y `plans.included_modules` usando `UNNEST()`.
3. **Refactorización de Código:** Qwen/Antigravity refactorizan las consultas en `src/` para usar las nuevas relaciones.
4. **Limpieza (Scrubbing):** Un script SQL posterior eliminará irrevocablemente los campos de tipo array antiguos.

### Fase 3: Triggers de Auditoría y Trazabilidad (Prioridad Media / P2) ✅ (COMPLETADO)
**Foco:** Consistencia de metadatos.
1. **PL/pgSQL:** Creación de la función genérica `update_updated_at_column()`.
2. **Aplicación Masiva:** Añadir triggers `BEFORE UPDATE` en todas las tablas transaccionales del dominio core (Ventas, Inventario, Clientes, Facturación).

### Fase 4: Tablas de Referencia y Dominio (Prioridad Baja / P3) ✅ (COMPLETADO)
**Foco:** Escalabilidad e Internacionalización.
1. **Migración de Enums/Checks:** Traducir listas estrictas de campos como `industry_type` o `plan` hacia tablas maestras reales (`industries`, `plan_types`).
2. Reemplazo de constraints a Foreign Keys.

---

## 🚀 Método de Trabajo y Coordinación (Protocolo de Acción)
1. **Diseño (Antigravity):** Antigravity redactará la migración SQL (`20260318XXXXXX_fase_N.sql`) en `supabase/migrations/` basada en este documento.
2. **Revisión Continua (Qwen):** Qwen podrá monitorear el pipeline en busca de errores tras las migraciones.
3. **Aplicación Estricta (Usuario):** Toda migración se prueba en staging local. Solo entonces se integra en main.

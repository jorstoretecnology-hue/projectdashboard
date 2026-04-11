# 🗺️ Implementation Plan - Memoria y Arquitectura
> **Status:** Módulo de autenticación completado. Base de datos con RLS asegurada (v5.5.0).
> **Próximo a abordar:** Primera Venta E2E → Limpieza `any`/`select('*')` → Pruebas E2E MercadoPago.

## 🎯 Objetivo de esta Memoria
Este archivo sirve como **memoria persistente** entre sesiones de IA (GUI). Su función es almacenar las decisiones arquitectónicas, estructuras de carpetas implementadas y el paso a paso detallado para no perder el contexto al iniciar una nueva conversación.

---

## 🏗️ Estado Actual de la Arquitectura

### 1. Base de Datos & Seguridad (Hardening)
Hemos completado la Fase 1 a Fase 15 de endurecimiento SQL:
* **RLS (Row Level Security)**: Todas las tablas operacionales tienen filtros `tenant_id` atados a `get_current_user_tenant_id()`.
* **Multitenancy Estricto**: Resolución de tenant en Server Components, nunca delegada al cliente.
* **Roles (RBAC)**: Unificados a mayúsculas (`OWNER`, `ADMIN`, `EMPLOYEE`, `VIEWER`, `SUPER_ADMIN`).

### 2. Decisiones Técnicas Aprobadas
* **Stack Principal:** Next.js (App Router), Supabase (PostgreSQL + Auth), Tailwind CSS, Shadcn/UI, Zod, React Hook Form.
* **Metadata Extensible:** Las tablas como `sales` usan campos JSONB de `metadata` para manejar información variable por nicho (e.g. mesa, mesero en restaurantes).
* **Quotas & Webhooks:** Uso agresivo de RPC atómicos (`increment_tenant_quota()`) en lugar de lectura/escritura manual, evitando "race conditions".

---

## 🗄️ Estado por Módulo (Actualizado 2026-04-01)

### ✅ customers — COMPLETO
* CRUD completo funcionando
* Soft delete implementado (`deleted_at` con trigger `handle_soft_delete`)
* RLS validado: SELECT / INSERT / UPDATE / DELETE (4 policies activas)
* Aislamiento por `tenant_id` verificado
* Trigger `prevent_metadata_change` activo → bloquea cambios a `tenant_id`
* Trigger `protect_row_metadata` → corregido (safe para INSERT/UPDATE)
* Trigger `sync_quota_usage` → activo

### 🔄 products — EN PROCESO
* Esquema fuerte implementado (campos: `name`, `category`, `price`, `stock`, `type`, `state`, `industry_type`, `tax_rate`, `tax_type`)
* **⚠️ Problemas pendientes:**
  * `industry_type` requiere valor válido del dominio CHECK (pendiente obtener valores válidos)
  * `state` y `type` pueden tener ENUM/CHECK constraints → verificar antes de insertar
  * Pendiente crear productos válidos para tenant `71bcb1fe-f1c6-4e6b-a3e7-ec66e7147e16`

### 🔄 sales — EN PROCESO
* Función `create_sale_transaction(...)` existe en **2 versiones (overloads)**:
  * **v1 (legacy):** `(p_tenant_id, p_user_id, p_customer_id, p_items)` — 4 args
  * **v2 (activa):** `(p_tenant_id, p_user_id, p_customer_id, p_payment_method, p_discount, p_tax_rate, p_notes, p_items, p_metadata)` — 9 args
* El código en `sales.service.ts` **llama correctamente a la v2** ✅
* **⚠️ Bug identificado:** Falla porque los productos del test no pertenecían al tenant correcto → corregido conceptualmente
* **⚠️ Deuda técnica en `sales.service.ts`:**
  * `console.error` → debe migrar a `logger.ts` (Regla 1.7)
  * `select('*')` en `getSales()` y `getSaleById()` (Regla 1.2 CRÍTICA)

### ⏳ Pendiente — Primera Venta End-to-End
**Objetivo inmediato:** Lograr una venta completa funcionando de punta a punta.

**Pasos concretos:**
1. Obtener valores válidos de `industry_type` (dominio CHECK en tabla `products`)
2. Obtener valores válidos de `state` y `type` (posible ENUM)
3. Insertar productos válidos para tenant `71bcb1fe-f1c6-4e6b-a3e7-ec66e7147e16`
4. Ejecutar `create_sale_transaction(...)` con la v2
5. Validar: tabla `sales`, `sale_items`, consistencia de stock

---

## 🔍 Inventario Técnico DB (Verificado 2026-04-01)
> Ver archivo completo en `docs/technical/INVENTORY_DB.md`

| Componente | Cantidad | Estado |
|-----------|---------|--------|
| Tablas Multi-Tenant | 25 | ✅ Documentadas |
| Tablas Globales | 13 | ✅ Documentadas |
| Views | 2 (`v_dashboard_stats`, `view_saas_health`) | ✅ Solo lectura |
| Funciones totales | 50 | ✅ Documentadas |
| Triggers | ~90 entradas | ✅ Documentados |
| Políticas RLS | 80 | ✅ Activas |
| Índices | 47 | ✅ Optimizados |

### Funciones RLS críticas (helpers de contexto)
```sql
get_current_user_tenant_id()  → uuid   (SECURITY DEFINER)
get_current_user_app_role()   → text   (SECURITY DEFINER)
is_super_admin()              → bool   (SECURITY DEFINER)
get_user_location_ids()       → uuid[] (SECURITY DEFINER)
```

### Problemas resueltos en sesión (2026-04-01)
* `auth.uid()` retornando NULL en SQL Editor → documentado (normal fuera de contexto auth)
* Triggers rompiendo por columnas inexistentes → `protect_row_metadata` corregido
* Intento de cambio de `tenant_id` bloqueado correctamente por trigger
* Datos cruzados entre tenants detectados y corregidos
* Inventario DB previo incompleto (script Python) → reemplazado por consultas SQL directas

---

## 🚀 Plan de Ejecución Activo

### Fase 1: Primera Venta E2E (P0 INMEDIATO)
**Objetivo:** Validar el flujo completo de negocio.
1. Verificar constraints de `industry_type`, `state`, `type` en `products`
2. Crear producto(s) válidos para tenant de prueba
3. Ejecutar `create_sale_transaction` v2 y verificar `sales` + `sale_items`

### Fase 2: Limpieza Técnica (Deuda Actual P0)
**Objetivo:** Sanitizar código heredado en módulos Core.
1. **Eliminar `console.error`** en `sales.service.ts` → reemplazar con `logger.ts`
2. **Eliminar `select('*')`** en `sales.service.ts` líneas 51 y 86
3. **Auditoría de `any`** en `src/modules/sales/` y `src/modules/inventory/`

### Fase 3: Módulo Financiero (MercadoPago)
**Objetivo:** Cerrar definitivamente la UI de Suscripciones.
1. **Pruebas E2E (Sandbox):** Finalizar flujos de pago hasta modificar suscripción real
2. **UI Definitiva:** `PaymentHistory.tsx` + fix `UpgradePlanDialog.tsx`

---

## 🚧 Cómo usar este documento en una Nueva Sesión
1. **Humano:** "Quiero que continúes trabajando en el proyecto. Aquí está la arquitectura y el plan: [Pegar este Markdown completo]".
2. **IA (Antigravity):** Lee, absorbe el contexto y propone inmediatamente los comandos o código necesario para avanzar en la **Fase 1: Primera Venta E2E**.

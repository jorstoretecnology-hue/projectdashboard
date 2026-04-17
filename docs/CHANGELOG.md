# CHANGELOG.md

> Todos los cambios notables en este proyecto serán documentados en este archivo siguiendo el formato [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2026-04-12] Sesión 7.1 — Integridad & Control Total (v6.1.1)

### 🛡️ Hardening de Base de Datos

- **Integridad Referencial**: Establecida relación `CASCADE` entre `auth.users` y `public.profiles` para prevenir perfiles huérfanos.
- **Protección de Ventas**: FK `sales.created_by` modificada a `ON DELETE SET NULL` para preservar historial al eliminar usuarios.
- **Unificación de Roles**: Eliminada columna legacy `role`. `app_role` ahora es la única fuente de verdad para RLS.
- **Triggers de Integridad**:
  - `handle_new_user`: Ahora inserta `app_role` (default 'OWNER') para evitar perfiles con rol nulo.
  - `trg_sync_tenant_plan`: Sincronización automática de `tenants.plan` con la suscripción activa.

### ⚙️ Gestión de Módulos (Admin UI)

- **Componente `TenantModules`**: Interfaz interactiva de toggles con actualizaciones optimistas y sincronización por plan vía RPC.
- **API Admin**: Endpoints `PATCH` y `POST` para control granular de módulos por tenant.
- **Optimización**: 5 índices compuestos adicionales para acelerar analítica y RLS.

## [2026-04-12] Sesión 7 — Inmunidad Operativa & Consolidación Billing

### 💳 Gestión de Suscripciones (SmartBilling Core)

- **Unificación de Contexto**: `TenantContext` ahora realiza una única query atómica para obtener datos de empresa, suscripciones y add-ons, optimizando el rendimiento.
- **Billing Guards**: Implementación del hook `useSubscriptionGuard` y el componente `SubscriptionBlockedOverlay` para prevenir operaciones de escritura en estados `past_due` o `suspended`.
- **Integridad Financiera**: Tipado estricto para estados de suscripción y addons.

### 🔧 Fixes & RPCs

- **RPC `create_sale_transaction`**: Actualizada para incluir `tenant_id` en `sale_items` y migrada completamente a tipos `INTEGER` (COP). Cualquier intento del cliente de enviar un `tenant_id` diferente en el body será ignorado por el backend y bloqueado por RLS.
- **Trigger `fn_calculate_sale_totals`**: Corregido bug crítico donde se referenciaba `NEW.tax` desde `sale_items` en lugar de la tabla base `sales`.

---

## [2026-04-12] Integridad CASCADE en Perfiles

**Decisión:** La relación entre `auth.users` y `public.profiles` debe ser `ON DELETE CASCADE`.

**Razón:** Los perfiles huérfanos (sin usuario en auth) causan errores críticos en el panel de administración y desajustes en el conteo de licencias. El perfil no tiene sentido sin su credencial de acceso.

---

## [2026-04-12] Unificación de Roles (Single Source of Truth)

**Decisión:** Eliminar la columna `role` y usar únicamente `app_role` (proveniente del JWT).

**Razón:** Mantener dos columnas de rol causaba inconsistencias donde un usuario era 'ADMIN' en una tabla y 'EMPLOYEE' en otra, rompiendo el RLS.

---

## [2026-04-12] Cache de Plan con Sincronización vía Trigger

**Decisión:** Mantener el campo `plan` en `tenants` (caché) pero sincronizado automáticamente mediante el trigger `trg_sync_tenant_plan` desde la tabla `subscriptions`.

**Razón:** Permite que el middleware valide límites de plan sin realizar un JOIN con la tabla de suscripciones en cada request, mejorando la latencia en ~20ms.

---

## [2026-04-12] UI de Gestión de Módulos con Estados Optimistas

**Decisión:** Implementar la gestión de módulos con actualizaciones optimistas (`toggleModule`) que revierten en caso de error.

**Razón:** Mejora la experiencia del superadmin al gestionar múltiples empresas, proporcionando feedback instantáneo sin esperar la respuesta del servidor en cada toggle.

---

## [2026-04-12] Sesión 6 — Refactor de Seguridad Atómica & Performance RLS

### 🔐 Seguridad y Aislamiento (Multi-tenancy)

- **Migración a JWT Puro**: Los helpers `get_current_user_tenant_id()` e `is_super_admin()` se refactorizaron para leer directamente del JWT, eliminando la latencia de queries a la tabla `profiles`.
- **Aislamiento Directo**: Inyección de `tenant_id` (NOT NULL) en la tabla `sale_items`. Ahora las políticas de RLS son quirúrgicas y no requieren JOINs con la tabla `sales`.
- **Purga de Políticas**: Eliminación de 16 políticas redundantes en las tablas `tenants`, `invitations` y `profiles`.

---

## [2026-04-11] Sesión 3 — Auditoría Completa + Dashboard Real

### 🛡️ Auditoría NotebookLM — Completada al 100%

- **Fix select('\*')**: Eliminados en `SupabaseInventoryRepository.ts`, `services.service.ts` y `auth/invite/page.tsx`. Ahora se usan columnas explícitas.
- **Fix tipos any**: Eliminados en `use-payments.ts`, `SupabaseCustomerRepository.ts` y `PaymentHistory.tsx`. TypeScript ahora tiene **CERO errores**.
- **Dashboard real**: Implementación de Server Component puro que carga Ventas del Día, KPIs y Actividad Reciente directamente desde Supabase sin `use client`.

---

## [2026-04-11] Sesión 2 — Migración Precios + Módulo DIAN

### 💰 Migración Precios INTEGER COP

- 16 columnas migradas en 8 tablas de `NUMERIC` a `INTEGER`.
- Vista `v_dashboard_stats` y trigger `fn_sync_sale_total_on_discount` recreados para soporte de enteros.
- ✅ Schemas Zod actualizados con `.int()` en todos los campos monetarios
- ✅ Módulo `dian` en `modules_catalog` y en `MODULE_DEFINITIONS`
- ✅ **Hardening v6.1.1**: Perfiles huérfanos eliminados, CASCADE Auth-Profiles, FK sales SET NULL.
- ✅ **Triggers Críticos**: Sincronización de planes y app_role automático.
- Inserción del slug `dian` en `modules_catalog`.
- Actualización de todos los tenants (13) via `activate_modules_for_tenant()`.

---

## [2026-04-11] Sesión 1 — Pivot Estratégico + Fixes Críticos

### 🎯 Pivot Estratégico

- Cambio a **Núcleo Universal POS + CRM + DIAN**. Derivación de lógica compleja a n8n y APIs de terceros (Alegra, MercadoPago).

### 🚀 Fixes Críticos

- Renombrado de middleware a `proxy.ts` para compatibilidad con Next.js 16.
- Inyección de `app_metadata.tenant_id` en el flujo de onboarding.

# DECISIONS.md

> Decisiones arquitectónicas y justificación técnica del sistema.

---

## [2026-04-12] Inmunidad Operativa vía Subscription Guards

**Decisión:** Implementar un bloqueo preventivo a nivel de UI y lógica de negocio basado en el estado de la suscripción (`past_due`, `suspended`).

**Razón:** Para asegurar el flujo de caja del SaaS, es vital evitar que los clientes operen el sistema si tienen deudas pendientes, permitiendo únicamente la navegación hacia áreas de pago.

**Implementación:**

- Hook `useSubscriptionGuard`: Intercepta acciones de escritura.
- Componente `SubscriptionBlockedOverlay`: Bloquea visualmente las pantallas operativas.
- `TenantContext`: Centraliza el estado de suscripción para validación atómica.

---

## [2026-04-12] RLS JWT-First para Performance Crítico

**Decisión:** Las políticas de RLS deben validar el `tenant_id` directamente desde el JWT (`auth.jwt() -> app_metadata`), prohibiendo sub-queries a `profiles` dentro de la política.

**Razón:** Cada política que consulta la tabla `profiles` dispara una query adicional en cascada. Con decenas de políticas, esto generaba latencias inaceptables (>500ms) en cada request.

**Implementación:**

- Refactor de `get_current_user_tenant_id()` para lectura de JWT pura.
- Eliminación de sub-consultas en 89 políticas RLS.

---

## [2026-04-11] Precios como INTEGER en COP

**Decisión:** Todos los precios en el sistema son INTEGER en pesos colombianos.

**Razón:** COP no usa centavos. Evita errores de punto flotante en cálculos financieros y simplifica validaciones Zod.

---

## [2026-04-11] Fotos en Supabase Storage, nunca base64 en DB

**Decisión:** Las fotos de inspección se suben a Storage y se guarda solo la URL.

**Razón:** Base64 infla el peso de la base de datos y degrada el rendimiento de las consultas y la paginación.

---

## [2026-04-11] Dashboard como Server Component

**Decisión:** La página `/dashboard` debe ser un Server Component puro.

**Razón:** Elimina el waterfall en el cliente y mejora el SEO y el Performance (LCP) al renderizar datos críticos en el servidor.

---

## [2026-04-11] proxy.ts como nombre del middleware (Next.js 16)

**Decisión:** El archivo de middleware debe llamarse `src/proxy.ts`.

**Razón:** Compatibilidad con la arquitectura interna de Next.js 16.2.2+ para evitar bloqueos en tiempo de compilación.

---

## [2026-04-11] tenant_id del JWT — Regla Inmutable

**Decisión:** El `tenant_id` corporativo debe obtenerse siempre de `user.app_metadata`.

**Razón:** Seguridad. El JWT está firmado digitalmente; cualquier intento del cliente de enviar un `tenant_id` diferente en el body será ignorado por el backend y bloqueado por RLS.

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

# 🛡️ Reporte de Auditoría de Seguridad — Base de Datos & Código
**Fecha:** 27 de marzo de 2026  
**Auditor:** Antigravity Security Specialist  
**Alcance:** Migraciones SQL, Políticas RLS, API Routes, Código TypeScript

---

## 🔴 HALLAZGOS CRÍTICOS

### [C-01] Archivos de Debug Confirmados en el Repositorio de Migraciones

**Severidad: 🔴 CRÍTICA**  
**Archivos:** `debug_n8n_test_mode.sql`, `trace_webhook_errors.sql`

Estos dos archivos **no siguen la convención de nombrado de migraciones** (`TIMESTAMP_nombre.sql`) y contienen:
- Una URL de webhook hardcoded apuntando a un tunnel ngrok activo: `https://cauline-lacey-tempered.ngrok-free.dev/webhook-test/supabase-events`
- La función `notify_webhook_event()` **sobrescrita** con modo debug y `debug_mode: true` en el payload
- Una tabla `webhook_debug_logs` creada en producción para loguear todos los payloads de webhooks (incluyendo `tenant_id` e `entity_id`)
- Un INSERT de prueba con un `tenant_id` hardcoded real: `791b9026-c1be-4d25-9ad2-4199685a0275`

**Impacto:** Si estas migraciones se aplicaron a producción (lo cual parece probable dado que tienen la función sobreescrita), **todos los eventos de dominio estarían siendo enviados al tunnel ngrok del desarrollador** en lugar del servicio de webhooks real. Esto representa una fuga de datos de producción.

**Acción inmediata:**
1. Eliminar los archivos del repositorio: `git rm supabase/migrations/debug_n8n_test_mode.sql supabase/migrations/trace_webhook_errors.sql`
2. Verificar si la función `notify_webhook_event()` en la BD apunta aún al tunnel ngrok
3. Verificar los registros de `webhook_debug_logs` en Supabase

---

### [C-02] GRANT ALL en Tablas Críticas para Roles Base

**Severidad: 🔴 CRÍTICA**  
**Archivos:** `20240117000005_fase1_hardening.sql`, `20260214000008_fix_user_role_permissions.sql`, `20260214000009_unblock_tenant_creation.sql`

Se encontraron múltiples sentencias `GRANT ALL`:
```sql
-- VIOLACIÓN DE PRINCIPIO MÍNIMO PRIVILEGIO:
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON TABLE tenants TO authenticated;
GRANT ALL ON TABLE tenants TO "user";
```

Aunque RLS esté activo, `GRANT ALL` otorga permisos de nivel DDL/DML a todos los usuarios autenticados. Las restricciones de datos son responsabilidad del RLS, pero otorgar `GRANT ALL ON ALL FUNCTIONS` es especialmente peligroso porque permite ejecutar cualquier función pública.

**Recomendación:** Cambiar a permisos granulares:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenants TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_tenant_id() TO authenticated;
```

---

### [C-03] 14 de 15 API Routes Sin Validación Zod y Sin Auth Check

**Severidad: 🔴 CRÍTICA**  
**Impacto:** Vulnerabilidad masiva de entrada de datos y acceso no autenticado

| Ruta | Zod | Auth Check |
|------|-----|------------|
| `api/admin/users/route.ts` | ❌ | ✅ |
| `api/cron/process-events/route.ts` | ❌ | ❌ |
| `api/v1/customers/[id]/route.ts` | ❌ | ❌ |
| `api/v1/customers/route.ts` | ❌ | ❌ |
| `api/v1/products/[id]/route.ts` | ❌ | ❌ |
| `api/v1/products/route.ts` | ❌ | ❌ |
| `api/v1/public/tracking/[id]/deliver/route.ts` | ❌ | ❌ |
| `api/v1/purchases/[id]/receive/route.ts` | ❌ | ❌ |
| `api/v1/purchases/route.ts` | ❌ | ❌ |
| `api/v1/sales/[id]/route.ts` | ❌ | ❌ |
| `api/v1/sales/route.ts` | ❌ | ❌ |
| `api/v1/services/orders/[id]/items/route.ts` | ❌ | ❌ |
| `api/v1/services/orders/route.ts` | ❌ | ❌ |
| `api/v1/services/vehicles/route.ts` | ❌ | ❌ |
| `api/webhooks/mercadopago/route.ts` | ✅ | N/A (firma HMAC) |

> **Nota crítica:** La ruta pública `/api/v1/public/tracking/[id]/deliver` no tiene auth check. Verificar si debería ser pública por diseño o si falta autenticación.

---

## 🟠 HALLAZGOS DE SEVERIDAD ALTA

### [A-01] Funciones RPC sin SECURITY DEFINER

**Severidad: 🟠 ALTA**  
Las siguientes RPCs críticas **no tienen SECURITY DEFINER**, lo que significa que se ejecutan con los permisos del *llamante* (usuario autenticado) en lugar del propietario de la función:

- `update_updated_at_column()` — trigger de timestamp
- `update_service_totals()` — calcula totales de servicios
- `create_sale_transaction()` — **RPC que maneja transacciones financieras**

La función `create_sale_transaction` es la más preocupante: sin `SECURITY DEFINER`, un usuario malintencionado podría aprovechar los permisos del trigger para manipular transacciones.

---

### [A-02] Funciones `is_superadmin()` y `is_super_admin()` Coexisten

**Severidad: 🟠 ALTA**  
En las migraciones existen **dos variantes del nombre**: `is_superadmin()` y `is_super_admin()`. Esto sugiere que algunas políticas RLS podrían estar apuntando a la función incorrecta. Si una política crítica usa `is_superadmin()` y esa función no está implementada correctamente, el check de SuperAdmin fallaría silenciosamente.

**Archivos con ambas:**
- `20260228000002_iam_architect_rls.sql` → `is_superadmin()`
- `20260228000011_unify_superadmin_functions.sql` → ambas
- `20260315000000_fix_superadmin_visibility.sql` → ambas

---

### [A-03] `tenant_id` Obtenido de `app_metadata` en el Cliente

**Severidad: 🟠 ALTA**  
**Archivo:** `use-payments.ts:34`

```typescript
.eq('tenant_id', user.app_metadata.tenant_id)
```

Aunque `app_metadata` proviene del JWT y no del cliente directamente, **no se usa `getRequiredTenantId()`** del helper del servidor. En un componente cliente, esto puede ser vulnerable si el JWT no se refresca correctamente. Debe usar `getRequiredTenantId()` dentro de una Server Action.

---

## 🟡 HALLAZGOS DE SEVERIDAD MEDIA

### [M-01] `console.log` / `console.error` en Código de UI Production

**Severidad: 🟡 MEDIA**  
Encontrados `console.error` en múltiples archivos de componentes (no tests). Estos exponen stack traces en el navegador del usuario en producción, violando OWASP A09.

### [M-02] `catch (err: any)` Restante en Archivos Core

**Severidad: 🟡 MEDIA**  
Detectado en `SupabaseCustomerRepository.ts` y `useSales.ts`. Debe ser `catch (err: unknown)`.

### [M-03] `pricing.ts` con 2 Ocurrencias de `: any`

**Severidad: 🟡 MEDIA**  
El módulo de precios de la industria usa tipos `any`. Si está relacionado con cálculo de tarifas o planes, este es un riesgo de seguridad dado que puede enmascarar valores incorrectos.

---

## ✅ PUNTOS FUERTES CONFIRMADOS

| Control | Estado |
|---------|--------|
| **RLS en todas las tablas** | ✅ Confirmado (0 tablas sin RLS) |
| **DISABLE ROW LEVEL SECURITY** | ✅ No encontrado |
| **Firma HMAC en webhooks MercadoPago** | ✅ Implementado |
| **Triggers de inmutabilidad de metadatos (Fase 14)** | ✅ Aplicados |
| **get_current_user_tenant_id() en políticas** | ✅ Generalizado |
| **Rate limiting en middleware** | ✅ Activo con fallback seguro |
| **Middleware debug flags restringidos a no-prod** | ✅ Implementado |

---

## 📋 PLAN DE ACCIÓN PRIORIZADO

| # | Acción | Severidad | Urgencia |
|---|--------|-----------|----------|
| 1 | Eliminar archivos debug del repo y verificar función en BD | 🔴 | HOY |
| 2 | Reemplazar `GRANT ALL` por permisos granulares | 🔴 | Esta semana |
| 3 | Agregar auth check a las 13 rutas API sin verificación | 🔴 | Esta semana |
| 4 | Agregar validación Zod a todas las rutas API | 🔴 | Esta semana |
| 5 | Añadir `SECURITY DEFINER` a `create_sale_transaction()` | 🟠 | Esta semana |
| 6 | Unificar `is_superadmin` → `is_super_admin` en todas las políticas | 🟠 | Esta semana |
| 7 | Migrar `use-payments.ts` a usar Server Action + `getRequiredTenantId()` | 🟠 | Próximo sprint |
| 8 | Reemplazar `catch (err: any)` por `unknown` | 🟡 | Próximo sprint |
| 9 | Reemplazar `console.error/log` en UI por `logger.ts` | 🟡 | Próximo sprint |

# CHANGELOG.md

## [2026-04-12] Sesión 7 — Inmunidad Operativa y Sistema de Bloqueo

### 💳 Gestión de Facturación (Inmunidad Operativa)

- **Optimización de TenantContext**: Unificación de la consulta de datos de empresa, suscripciones y add-ons en una sola llamada atómica a Supabase. Se reducen roundtrips y se asegura la consistencia de estados.
- **useSubscriptionGuard**: Nuevo hook para centralizar la lógica de protección de rutas y acciones basadas en el estado de la suscripción (`active`, `past_due`, `suspended`).
- **SubscriptionBlockedOverlay**: Componente de interfaz que bloquea el acceso a funciones operativas (ventas, pedidos) si el cliente está en mora, manteniendo acceso a las facturas y área de pago.
- **Lógica Híbrida de Módulos**: El helper `isModuleActive` ahora detecta módulos provenientes tanto del plan base como de add-ons comprados independientemente.

### 🔧 Ajustes Técnicos

- **Casts Controlados**: Se implementó un cast `as unknown` temporal en `TenantContext.tsx` para manejar la tabla `tenant_subscription_items` hasta la próxima regeneración de tipos globales (Línea 212).
- **Sincronización de Contextos**: Eliminada la latencia entre el cambio de estado de pago y el reflejo en la interfaz del Dashboard.

### ✅ Verificación

- `npx tsc` — 0 errores.
- Flujo de bloqueo validado visualmente con estados simulados.

## [2026-04-12] Sesión 6 — Refactor RLS + sale_items tenant_id + Fix RPC

### 🔐 Refactor RLS (6 migraciones vía MCP)

- `rls_refactor_1` — get_current_user_tenant_id() y is_super_admin() migradas
  a JWT puro. Eliminadas queries a profiles en cada evaluación RLS.
  Impacto: cada request ya no dispara N queries a profiles por políticas.

- `rls_refactor_2` — Políticas duplicadas eliminadas:
  tenants: 14 → 5 | invitations: 10 → 3 | suppliers: 2 → 1 | purchase_orders: 2 → 1

- `rls_refactor_3` — profiles: 11 → 6 políticas. Eliminadas redundantes en español
  y duplicados de superadmin.

- `rls_refactor_4` — sale_items.tenant_id agregada (NOT NULL).
  Aislamiento directo — elimina JOIN con sales en cada operación RLS.
  4 filas existentes migradas con tenant_id correcto.
  Bug corregido: fn_calculate_sale_totals intentaba escribir NEW.tax
  desde sale_items (columna que no existe ahí). Trigger reescrito
  para operar correctamente sobre sales.

- `fix_create_sale_transaction` — RPC actualizada:
  - tenant_id agregado en INSERT a sale_items (crítico — NOT NULL)
  - Parámetros p_discount y p_tax_rate migrados NUMERIC → INTEGER
  - Cálculo de IVA: ROUND(base \* p_tax_rate / 100) en INTEGER COP

- `drop_legacy_create_sale_transaction_numeric` — eliminada versión
  antigua con parámetros NUMERIC para evitar ambigüedad de overloads.

### ✅ Verificación código TypeScript

- sales.service.ts — sin cambios necesarios. RPC se llama correctamente.
- tax_rate ya era z.number().int().nonnegative().max(100) en Zod.
- p_tax_rate se pasa directo (19, no 0.19) — alineado con nueva firma.

### 📊 Estado de políticas RLS tras refactor

| Tabla           | Antes       | Después    |
| --------------- | ----------- | ---------- |
| tenants         | 14          | 5          |
| invitations     | 10          | 3          |
| profiles        | 11          | 6          |
| suppliers       | 2           | 1          |
| purchase_orders | 2           | 1          |
| sale_items      | 4 heredadas | 4 directas |
| Total DB        | 89          | ~72        |

### 🗄️ Migraciones aplicadas (4 migraciones vía MCP)

- `billing_tenant_subscription_items` — tabla nueva para add-ons por tenant.
  Columnas: id, tenant_id, module_slug (FK → modules_catalog), monthly_price
  (INTEGER COP), activated_at, notes. UNIQUE (tenant_id, module_slug).
  RLS: tenant ve solo los suyos, SUPER_ADMIN ve todos.

- `billing_audit_logs` — historial inmutable de cambios de precio y
  activaciones manuales. Columnas: action, module_slug, old_price, new_price,
  old_plan, new_plan, admin_id, reason. Solo SUPER_ADMIN puede leer.
  Nadie escribe directamente — solo vía función.

- `billing_summary_view` — vista vw_tenant_billing_summary. Retorna por tenant:
  plan_base_price + addons_total + total_monthly + addons_detail (JSONB array).
  Verificada con datos reales: 13 tenants, totales correctos.

- `billing_activate_module_with_price_fn` — dos funciones nuevas:
  - activate_addon_for_tenant(tenant_id, module_slug, price, admin_id, notes)
    Upsert en subscription_items + activa en tenant_modules + registra audit log.
    Retorna status: MODULE_ACTIVATED | PRICE_CHANGED | no_change.
  - can_activate_module_for_tenant(tenant_id, module_slug)
    Valida reglas de negocio. Módulo 'dian' requiere plan >= $129.000 (professional).

### 🔧 Decisiones técnicas

- module_slug como FK (no module_id UUID) — modules_catalog usa slug como PK,
  mantiene consistencia con el resto del schema.
- activate_modules_for_tenant existente NO fue modificada — se creó función
  separada activate_addon_for_tenant para add-ons manuales (modelo agencia).
- billing_audit_logs is inmutable por diseño — INSERT solo via SECURITY DEFINER.

### ✅ Verificación

- Vista vw_tenant_billing_summary retorna datos reales de 13 tenants
- Planes detectados: enterprise ($299k), professional ($129k), starter ($49k)
- Todos los add-ons en 0 (base limpia para primer cliente)

## [v5.7.0] - 2026-04-12

#### Añadido

- **Módulo `work_orders`**: Nueva infraestructura para gestión de órdenes de trabajo.
  - `src/modules/work_orders/types.ts`: Definición estricta de estados, prioridades e ítems.
  - `src/modules/work_orders/services/work-orders.service.ts`: Capa de servicio con aislamiento de tenant y soporte para tablas no tipadas.
  - `src/modules/work_orders/components/WorkOrderDialog.tsx`: Dialog multi-step con integración de cliente, vehículo e inspección (Storage).
- **Inspección en Storage**: Migración de fotos de inspección de base64 a Supabase Storage (`/inspections`).

#### Cambios / Refactorización

- **`POSDialog.tsx`**: Limpieza profunda del componente de ventas.
  - Eliminada lógica de inspección (cámara, checklist) para desacoplar el módulo de ventas de industrias específicas.
  - Simplificado el flujo de 3 pasos a 2 pasos (Selección -> Pago).
  - Textos de confirmación ahora dinámicos basados en la configuración del tenant.
- **Infraestructura de Tipos**: Implementación de casts controlados para tablas desincronizadas en `database.types.ts`.

## [2026-04-11] Sesión 3 — Dashboard Server Component + Fix TypeScript

**Refactorización: dashboard/page.tsx → Server Component**

- Eliminado `'use client'` del dashboard principal
- Datos cargados con `supabase.auth.getUser()` + queries directas en servidor
- `tenant_id` obtenido del JWT (`user.app_metadata?.tenant_id`) — nunca del body
- Eliminados: `useEffect`, `useState`, `tenantDashboardService`, `Skeleton`, loading states
- Sin `select('*')` — queries con columnas específicas (`id`) y `count: 'exact'`

**Componentes cliente extraídos a `_components/`:**

- `DashboardHero.tsx` — Hero section con `useTenant`
- `ThemeSwitcher.tsx` — Selector de tema con `useTheme` + hidratación
- `ModulesGrid.tsx` — Grilla de módulos activos con `useModuleContext`

**Fix: `TrendChart.tsx` — agregado `'use client'`**

- Usa `next/dynamic` con `ssr: false` (recharts), requiere Client Component
- Al convertir page.tsx a Server Component, dejó de heredar el contexto cliente

**Fix: 5 errores TypeScript preexistentes — todos resueltos**

- `CustomersClient.tsx:33` — agregado `import { useQueryState, parseAsString } from "nuqs"`
- `PaymentHistory.tsx:86` — `formatCurrency()` solo acepta 1 arg, eliminado `payment.currency`
- `MobileSidebar.tsx:22` — `logout` no existe en AuthContext, cambiado a `signOut`
- `MobileSidebar.tsx:63` — `module.name` no existe en `ActiveModule`, cambiado a `module.navigation[0]?.label`
- `Sidebar.tsx:22` — `IconRenderer` no estaba exportado, agregado `export`

**Verificación:**

- ✅ `npx tsc --noEmit` — Exit code 0 (0 errores)
- ✅ Dashboard carga correctamente en localhost:3000
- ✅ Agente ejecutor: Antigravity (Gemini → Claude Opus)

---

## [2026-04-11] Sesión 2 — Auditoría NotebookLM + Migración precios

**Auditoría realizada con NotebookLM**
Se subieron los 17 SKILL.md + PROJECT_STATE.md + esquema DB + documentación.
Pregunta clave: "¿En qué partes mi PROJECT_STATE.md rompe mis SKILL.md?"
Hallazgos críticos identificados:

- Precios en numeric en vez de INTEGER COP — **RESUELTO**
- `select('*')` en 21 ocurrencias — pendiente
- 64 tipos `any` en TypeScript — pendiente (5 confirmados)
- POSDialog mezcla lógica de industria — pendiente
- `dashboard/page.tsx` como `'use client'` — pendiente
- Fotos de inspección en base64 — pendiente
- Tenants sin profile (jaomart, Empresa Debug) — baja prioridad

**Migración: Precios NUMERIC → INTEGER COP**

- 16 columnas migradas en 8 tablas
- Proceso: eliminar vista + trigger → migrar columnas → recrear vista + trigger
- Vista `v_dashboard_stats` recreada correctamente
- Trigger `fn_sync_sale_total_on_discount` recreado con tipos INTEGER
- Schemas Zod actualizados: `.int()` en todos los campos monetarios
- Verificación: query de confirmación retornó 0 columnas numeric restantes
- Tablas afectadas: `products`, `inventory_items`, `sales`, `sale_items`,
  `purchase_orders`, `service_orders`, `payments`, `plans`

**Módulo DIAN agregado**

- `modules_catalog`: slug `dian` insertado
- `MODULE_DEFINITIONS`: entrada `dian` con ruta `/dian` e ícono `FileText`
- Página `/dian` pendiente de crear

**Modelo de negocio definido**

- Basic: $150k setup + $60k/mes
- Pro: $600k setup + $150k/mes (incluye DIAN)
- Premium: $1.5M+ setup + $350k/mes (incluye automatizaciones n8n)
- Free: 14 días demo del plan Pro

---

## [2026-04-11] Sesión 1 — Pivot estratégico + Fixes críticos

**Decisiones arquitectónicas**

- Pivot a núcleo universal POS + CRM + DIAN
- Módulos complejos delegados a n8n + APIs terceros
- Reservas → Cal.com | DIAN → Alegra | WhatsApp → Twilio via n8n

**Fixes aplicados**

- `proxy.ts` — convención correcta Next.js 16
  - Problema: renombrado a middleware.ts causaba hanging
  - Fix: revertido a `proxy.ts`
  - Agente: Qwen
- `app_metadata.tenant_id` en onboarding
  - Problema: onboarding no escribía tenant_id en JWT
  - Fix: supabaseAdmin.auth.admin.updateUserById() al final del onboarding
  - Archivo: `src/app/onboarding/actions.ts`
  - Agente: Qwen
- `ModuleContext` optimizado
  - Problema: query extra a profiles innecesaria
  - Fix: JWT primero + fallback a profiles
  - Archivo: `src/providers/ModuleContext.tsx`
  - Agente: Qwen
- Variable `SUPABASE_SERVICE_ROLE_KEY`
  - Problema: no estaba en `.env.local`
  - Fix: agregada manualmente

**Migraciones Supabase**

- `activate_modules_for_tenant` — rediseñada
- Núcleo universal por plan
- Módulos adicionales por industria
- Todos los 13 tenants actualizados
- Módulo `dian` agregado al catálogo

**Validaciones**

- ✅ Usuario nuevo (nova/discoteca) completó onboarding end-to-end
- ✅ Dashboard carga 4 módulos correctos (free plan)
- ✅ Superadmin `/console/modules` muestra 16 módulos

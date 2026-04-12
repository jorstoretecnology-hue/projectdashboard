# CHANGELOG.md

## [2026-04-11] Sesión 5 — Motor de Suscripciones y Add-ons

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

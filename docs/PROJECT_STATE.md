# PROJECT_STATE.md

> Última actualización: Abril 12, 2026 — Sesión 7 (v6.1.1)
> Hardening de DB, Integridad CASCADE y Gestión de Módulos completada.

---

## Estado general: 🟢 ESTABLE — BASE SÓLIDA

---

## ¿Qué funciona hoy?

### Infraestructura

- ✅ Next.js 16.2.2 con Turbopack
- ✅ `proxy.ts` como middleware (Next.js 16 — NUNCA renombrar a middleware.ts)
- ✅ Supabase conectado (proyecto: kpdadwtxfazhtoqnttdh / DashboardProject)
- ✅ Variables de entorno: `.env.local` completo (URL + ANON_KEY + SERVICE_ROLE_KEY)
- ✅ Vercel deploy configurado

### Auth y Multi-tenant

- ✅ Login / registro / onboarding completo (4 pasos)
- ✅ `app_metadata.tenant_id` + `app_role: OWNER` escritos en JWT al completar onboarding
- ✅ RLS habilitado en todas las tablas
- ✅ ModuleContext: lee JWT primero, fallback a profiles
- ✅ TenantContext funcionando

### Sistema de Módulos

- ✅ 17 módulos en `modules_catalog` (incluye dian)
- ✅ `activate_modules_for_tenant()` con núcleo universal por plan + industria
- ✅ Dashboard renderiza módulos activos dinámicamente desde DB
- ✅ Sidebar dinámico por tenant
- ✅ 13 tenants actualizados con módulos correctos
- ✅ **Módulo `dian` completo**: UI `/dian`, Alegra provider, encriptación AES-256-GCM, logs inmutables

### Base de Datos — COMPLETAMENTE LIMPIA ✅

- ✅ 16 columnas de precio migradas de NUMERIC a INTEGER COP
- ✅ Vista `v_dashboard_stats` recreada con INTEGER
- ✅ Trigger `fn_sync_sale_total_on_discount` recreado con INTEGER
- ✅ Schemas Zod actualizados con `.int()` en todos los campos monetarios
- ✅ Módulo `dian` en `modules_catalog` y en `MODULE_DEFINITIONS`
- ✅ **Hardening v6.1.1**: Perfiles huérfanos eliminados, CASCADE Auth-Profiles, FK sales SET NULL.
- ✅ **Integridad Crítica**: Triggers de sincronización de planes y asignación de app_role OK.
- ✅ **Admin UI**: Panel de toggle de módulos funcional con optimismo.

### Módulos con UI funcional

- ✅ Dashboard (KPIs, tendencias, actividad reciente)
- ✅ Ventas / POS (POSDialog funcional)
- ✅ Clientes / CRM (lista, crear, editar)
- ✅ Inventario (productos, stock)
- ✅ Configuración
- ✅ Billing (estructura base)
- ✅ Superadmin `/console` (tenants, módulos, usuarios, industrias)

---

## Session Summary (2026-04-11) — Sesión 5

### Migraciones billing aplicadas

| Migración                             | Estado |
| ------------------------------------- | ------ |
| billing_tenant_subscription_items     | ✅     |
| billing_audit_logs                    | ✅     |
| billing_summary_view                  | ✅     |
| billing_activate_module_with_price_fn | ✅     |

### Nuevas tablas y objetos DB

| Objeto                           | Tipo    | Notas                                 |
| -------------------------------- | ------- | ------------------------------------- |
| tenant_subscription_items        | tabla   | add-ons por tenant, INTEGER COP       |
| billing_audit_logs               | tabla   | historial inmutable, solo SUPER_ADMIN |
| vw_tenant_billing_summary        | vista   | plan + add-ons + total mensual        |
| activate_addon_for_tenant()      | función | upsert + audit log automático         |
| can_activate_module_for_tenant() | función | valida reglas (dian = pro mínimo)     |

### Pending / Known Issues

| #   | Issue                           | Notas                                                  |
| --- | ------------------------------- | ------------------------------------------------------ |
| 1   | Fotos base64 → Supabase Storage | InspectionCamera aún guarda base64                     |
| 2   | Regenerar database.types.ts     | work-orders.service.ts usa as unknown as               |
| 3   | UI Billing page                 | Consumir vw_tenant_billing_summary                     |
| 4   | ~~Página /dian~~                | ✅ **RESUELTO** — UI creada con provider Alegra + logs |
| 5   | Aplicar migración DIAN en DB    | `20260412000001_add_dian_module.sql`                   |

### Cómo consumir vw_tenant_billing_summary

```ts
// Server Component — src/app/(app)/billing/page.tsx
const { data: billing } = await supabase
  .from('vw_tenant_billing_summary')
  .select(
    'plan_slug,plan_name,plan_base_price,addons_total,total_monthly,addons_count,addons_detail',
  )
  .eq('tenant_id', tenantId)
  .single();
```

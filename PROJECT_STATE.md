# PROJECT_STATE.md
> Última actualización: Abril 12, 2026 — Sesión 7 (Inmunidad Operativa)
> Auditoría NotebookLM & Performance 100% completada

---

## Estado general: 🟢 PRODUCCIÓN-READY — BASE SÓLIDA & BLINDADA

---

## ✅ Qué funciona hoy

### Infraestructura (v6.1.0)
- ✅ Next.js 16.2.2 con Turbopack
- ✅ `proxy.ts` como middleware (NUNCA renombrar)
- ✅ Supabase conectado (Proyecto de Alta Disponibilidad)
- ✅ **Optimización RLS**: JWT-puro en helpers (0 queries a profiles en evaluación de acceso).
- ✅ TypeScript — CERO errores (`npx tsc --noEmit` limpio)

### Auth y Multi-tenant
- ✅ Login / registro / onboarding completo
- ✅ Aislamiento estricto: `tenant_id` en JWT e inyección directa en DB.
- ✅ **Inmunidad Operativa**: Sistema de bloqueo preventivo por mora via `useSubscriptionGuard` y `SubscriptionBlockedOverlay`.

### Sistema de Módulos & Facturación
- ✅ 16 módulos activables vía catálogo.
- ✅ `isModuleActive()` híbrido: Plan Base + Add-ons.
- ✅ Unified `TenantContext`: Datos del negocio, suscripción y extras en una sola llamada a Supabase.

### Base de Datos — BLINDAJE NIVEL 1
- ✅ **Performance**: Reducción de 89 a ~72 políticas RLS activas (eliminación de redundancia).
- ✅ **Aislamiento**: Columna `tenant_id` NOT NULL en `sale_items`.
- ✅ **Integridad**: Trigger `fn_calculate_sale_totals` corregido y optimizado para INTEGER COP.
- ✅ **RPCs**: `create_sale_transaction` unificada con tipos INTEGER.

### Dashboard & Storage
- ✅ Dashboard — Server Component puro con datos reales (Kardex, Ventas, Clientes).
- ✅ Storage Protegido: Buckets `signatures`, `inspections` y `products` con RLS.

---

## ❌ Pendientes para primer cliente real

### Bloqueantes
- ❌ Integración Alegra API — por iniciar.
- ❌ MercadoPago — probar end-to-end sandbox (Fase 11e).
- ❌ Renombrar planes en DB (free/starter/professional → basic/pro/premium).
- ❌ Página `/dian` — UI base pendiente.

### No bloqueantes
- ⚠️ OTP 6 dígitos recuperación contraseña.
- ⚠️ Módulo `dian` no incluido aún en todos los planes automáticos.

---

## Modelo de negocio definido

| Plan | Setup | Mensualidad | Módulos |
|------|-------|-------------|---------|
| Free (14 días) | $0 | $0 | Demo Pro |
| Basic | $150k COP | $60k/mes | POS + CRM + Inv + Config |
| Pro | $600k COP | $150k/mes | Basic + DIAN + Reports + Industry |
| Premium | $1.5M+ COP | $350k/mes | Full Access + Soporte 24/7 |

---

## Próximos pasos (Roadmap Inmediato)

1. **Fase 11e**: Pruebas E2E Sandbox MercadoPago.
2. **Fase DIAN**: Crear UI `/dian` y conectar con API Alegra.
3. **Identidad**: Renombrar planes en tabla `plans` y `tenants`.

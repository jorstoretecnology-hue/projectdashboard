# 📊 Progress Tracker (PROGRESS_TRACKER.md)

> **⚠️ DOCUMENTO VIVO — Actualizar al final de CADA sesión de trabajo.**
>
> Este documento es la fuente de verdad del estado actual del proyecto.
> Cualquier IA o desarrollador DEBE leerlo al inicio de cada sesión.

---

## 🔄 Última Actualización

| Campo | Valor |
|-------|-------|
| **Fecha** | 25 de marzo de 2026 |
| **Versión actual** | 5.5.0 (Estabilización & Hardening) |
| **Fase activa del Roadmap** | **Fase 11e:** Ejecutar Pruebas E2E con Sandbox MP |
| **Estado Global** | 🟡 82% Completado (Fases 1-14 Validadas) |
| **Qué se hizo esta sesión** | ### ✅ Logros Recientes (25 de marzo 2026)<br><br>**Sesión 1 - Hardening DB**:<br>- **fix**: 4 migraciones de corrección de schema críticos<br>  - `fk_tenant_specialty` duplicadas → 2 FKs independientes correctas<br>  - `products.sku` UNIQUE global → `UNIQUE(tenant_id, sku)`<br>  - `invitations.app_role` lowercase → uppercase alineado con AppRole<br>  - `industry_specialties(slug)` → UNIQUE constraint agregado<br><br>**Sesión 2 - Roles**:<br>- **fix**: unificación completa del sistema de roles<br>  - `auth.ts` eliminado `.toLowerCase()`, comparaciones uppercase<br>  - `types/index.ts` eliminado `UserRole` legacy<br>  - `profiles.app_role` datos migrados a uppercase<br>  - `profiles_app_role_check` constraint aplicado<br>  - `guards.test.ts` test case-sensitivity agregado<br><br>**Sesión 3 - Quotas & Webhooks** (migración aplicada y verificada en Supabase):<br>- **fix**: QuotaEngine race condition eliminada con RPCs atómicas<br>  - `increment_tenant_quota()` con `INSERT ON CONFLICT DO UPDATE`<br>  - `decrement_tenant_quota()` con `GREATEST(0, current - amount)`<br>  - `engine.ts` refactorizado usando `rpc()` en vez de read-then-write e integrado `logger.error`<br>- **fix**: webhook MercadoPago bypass cerrado<br>  - 500 en producción sin `MERCADOPAGO_WEBHOOK_SECRET`<br>  - 401 en producción sin `x-signature`<br>  - Dev mode preserva tolerancias con `logger.warn`<br>- **Verificación en Supabase** (queries ejecutadas post-migración):<br>  - `increment_tenant_quota` y `decrement_tenant_quota` → confirmadas en `information_schema.routines`<br>  - `profiles_app_role_check` → confirmada en `pg_constraint` con `CHECK (app_role = ANY (ARRAY['OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER', 'SUPER_ADMIN']))` ✅<br>- **nuevo**: protocolo de verificación post-migración documentado en `.antigravity/rules/database-rules.md`<br><br>**Sesión 4 - Remediación de Seguridad (Fase 15)**:<br>- **fix**: Eliminación de datos de ngrok en archivos de migración debug.<br>- **feat**: Implementación de `tracking_token` en `sales` para acceso público seguro.<br>- **security**: Endurecimiento de permisos de base de datos (mínimo privilegio).<br>- **audit**: Auditoría de esquema SQL 100% aprobada contra Roadmap (v5.5.0). 📄 `sql_audit_verdict_27mar.md`. |
| **Próximo paso concreto** | **Próximo paso:** Limpieza de `any` + `select('*')` en módulos de Ventas/Inventario |

---

## 🗄️ DATA LAYER HARDENING - ESTADO FINAL

### ✅ Fases 1-4: COMPLETADAS EN PRODUCCIÓN

| Fase | Componente | Estado | Impacto |
|------|------------|--------|---------|
| **Fase 1-5** | Hardening & Types | ✅ **COMPLETADO** | Sistema 100% tipado y seguro |
| **Fase 6** | Validación de Flujos | ✅ **COMPLETADO** | Onboarding & RLS verificados |
| **Fase 11a** | Infra MercadoPago | ✅ **COMPLETADO** | Tablas, Webhook y Handler listos |
| **Fase 11b** | UI MercadoPago | ✅ **COMPLETADO** | Botones de pago y suscripciones |
| **Fase 11c** | Diseño UX/UI Billing | ✅ **COMPLETADO** | Wireframes, Design System, Spec de componentes |
| **Fase 13** | RLS Granular | ✅ **COMPLETADO** | Aislamiento estricto por sede |
| **Audit F1** | Auditoría QA Fase 1 | ✅ **COMPLETADO** | Integridad, RLS y Esquemas validados |
| **Audit F2-10**| Auditoría UX/Tech Core | ✅ **COMPLETADO** | Auth, APIs y Flex validados. ⚠️ Gaps en stock/auto identificados. |
| **Audit UI/UX** | Auditoría Interfaces Frontend | ✅ **COMPLETADO** | Estética premium validada. 🛑 Gaps P0 en POS/Clientes. |
| **Hardening** | Refactor Inventario & SQL | ✅ **COMPLETADO** | Catálogo unificado y dominios estandarizados |
| **Fase 15** | Remediación de Seguridad | ✅ **COMPLETADO** | Trazabilidad por token y endurecimiento de DB |

**Backend refactorizado:** ✅ `tenant.service.ts` y métricas actualizados

### 🔄 Pendiente Inmediato (HOY)

| Tarea | Prioridad | Tiempo | Responsable |
|-------|-----------|--------|-------------|
| Regenerar tipos TypeScript | P0 | 0 min | ✅ COMPLETADO |
| Ejecutar `npm run type-check` | P0 | 0 min | ✅ PASADO (0 errores) |
| Pruebas de QA Automatizadas | P0 | - | ✅ Suite expandida (28 tests) |

### 📋 Fases Futuras

| Fase | Descripción | Prioridad | Estado |
|------|-------------|-----------|--------|
| **Fase 11d** | UI final Billing (PaymentHistory + fix UpgradePlanDialog) | P0 | ✅ **COMPLETADO** |
| **Fase 11e** | Pruebas E2E con Sandbox MP | P0 | ⏳ Pendiente |
| **Cleanup** | Drop de columnas legacy | P3 | ⏳ 1-2 semanas |

---

## 🎯 PRÓXIMAS FEATURES SUGERIDAS

| Feature | Prioridad | Complejidad | Impacto |
|---------|-----------|-------------|---------|
| Pagos (MercadoPago/Stripe) | ALTA | Media | Ingresos |
| Notificaciones (n8n + WhatsApp) | ALTA | Media | UX |
| Multi-sede | MEDIA | Alta | Enterprise |
| Reportes avanzados | MEDIA | Baja | Retención |
| i18n (Inglés/Español) | BAJA | Media | Internacionalización |

---

## 🏗️ Estado del Roadmap (IMPLEMENTATION_ROADMAP.md)

| Fase | Nombre | Estado | Notas |
|------|--------|--------|-------|
| 0 | Setup y Contexto | ✅ | |
| 1 | DB Migration | ✅ | |
| 2 | Auth & Security | ✅ | |
| 3-7 | APIs Core (Prod, Cust, Sales, Purchase, Service) | ✅ | **Core Finalizado** |
| 7.5 | Flex API (Restaurantes/Retail) | ✅ | Notas por item + Metadata. |
| 8-9 | Integraciones Core & Refactor | ✅ | Fase 9 Completada. |
| 10 | Onboarding & Notificaciones | ✅ | OTP & Auto-Recovery implementados. |
| **11** | **Integración Financiera & MercadoPago** | ✅ | **Cerrado**: Infraestructura y handlers. Falta UI final. |

---

## 📚 NUEVA DOCUMENTACIÓN CREADA (MARZO 2026)

### Para IAs de Antigravity
| Documento | Propósito | Ubicación |
|-----------|-----------|-----------|
| **Audit Phase 1** | Reporte de seguridad detallado de los cimientos (Fase 1) | `docs/security/reports/audit_report_phase1.md` |
| **Audit Core Phases** | Auditoría integral de las fases de expansión (Fases 2-10) | `docs/security/reports/audit_report_core_phases.md` |
| **QA Report F2-10** | Reporte detallado de hallazgos técnicos y brechas de lógica | [PHASE2_10_QA_AUDIT_REPORT.md](file:///C:/Users/Jaomart/.gemini/antigravity/brain/ba4768cb-4ece-4088-b565-5f2045dec1d6/PHASE2_10_QA_AUDIT_REPORT.md) |
| **AI Context Hub** | Documento maestro con arquitectura, estado, prioridades y patrones | `../ARCHITECTURE_SUMMARY.md` |
| **Task Handoff Template** | Plantilla para transferir contexto entre sesiones de IAs | `./TASK_HANDOFF_TEMPLATE.md` |
| **AI QuickStart Guide** | Guía de inicio rápido para IAs nuevas | `./AI_QUICKSTART.md` |

### Cómo Usar la Nueva Documentación
```
Flujo recomendado para IAs:
1. Leer ARCHITECTURE_SUMMARY.md (panorama general)
2. Leer PROGRESS_TRACKER.md (estado actual y tareas)
3. Leer TASK_HANDOFF_TEMPLATE.md (si existe, para contexto específico)
4. Consultar documentación específica según la tarea
```

---

## 🔑 Decisiones Técnicas Importantes
- **JSONB Metadata**: Se añadió una columna `metadata` en `sales` para guardar información variable (Mesa, Mesero, PAX) sin cambiar el esquema.
- **Item Level Instructions**: `sale_items` ahora tiene `notes` para instrucciones de preparación (KDS).
- **Documentación Centralizada**: Se creó `ARCHITECTURE_SUMMARY.md` como único punto de verdad para IAs, consolidando información dispersa en múltiples docs.

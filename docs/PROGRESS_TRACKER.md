# 📊 Progress Tracker (PROGRESS_TRACKER.md)

> **⚠️ DOCUMENTO VIVO — Actualizar al final de CADA sesión de trabajo.**
>
> Este documento es la fuente de verdad del estado actual del proyecto.
> Cualquier IA o desarrollador DEBE leerlo al inicio de cada sesión.

---

## 🔄 Última Actualización

| Campo                       | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fecha**                   | 12 de abril de 2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Versión actual**          | 6.1.0 (Sesión 7: Inmunidad Operativa 🛡️)                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Fase activa del Roadmap** | **E2E:** Validación de Kardex e Inventario                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Estado Global**           | 🟢 98% Completado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Qué se hizo esta sesión** | ### ✅ Logros (12 de abril 2026)<br><br>**Sesión 6 (Performance RLS):**<br>- Refactor de helpers a JWT-puro (0 queries a profiles en RLS).<br>- Desnormalización de `sale_items.tenant_id` para aislamiento directo.<br>- Reducción de 89 a ~72 políticas RLS activas.<br><br>**Sesión 7 (Inmunidad Operativa):**<br>- Unified `TenantContext` query (Tenants + Sub + Addons).<br>- `useSubscriptionGuard` & `SubscriptionBlockedOverlay` implementados.<br>- Bloqueo automático en estados `past_due` / `suspended`. |
| **Próximo paso concreto**   | **Fase 11e**: Pruebas E2E con Sandbox MercadoPago                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

---

## 🗄️ DATA LAYER HARDENING - ESTADO FINAL

### ✅ Fases 1-4: COMPLETADAS EN PRODUCCIÓN

| Fase            | Componente                         | Estado            | Impacto                                        |
| --------------- | ---------------------------------- | ----------------- | ---------------------------------------------- |
| **Fase 1-5**    | Hardening & Types                  | ✅ **COMPLETADO** | Sistema 100% tipado y seguro                   |
| **Fase E2E-1**  | Motor Atómico y Transacciones      | ✅ **COMPLETADO** | Transaccionalidad validada 100%                |
| **Fase E2E-2**  | Validación de Kardex e Inventario  | [/] **INICIADO**  |                                                |
| **Fase E2E-3**  | Integración de Pagos (MercadoPago) | [/] **CIERRE**    | Infra y Handlers listos                        |
| **Fase 11a**    | Infra MercadoPago                  | ✅ **COMPLETADO** | Tablas, Webhook y Handler listos               |
| **Fase 11b**    | UI MercadoPago                     | ✅ **COMPLETADO** | Botones de pago y suscripciones                |
| **Fase 11c**    | Diseño UX/UI Billing               | ✅ **COMPLETADO** | Wireframes, Design System, Spec de componentes |
| **Fase 11d**    | UI final Billing                   | ✅ **COMPLETADO** | Sistema de bloqueo operativo funcional         |
| **Fase 13**     | RLS Granular                       | ✅ **COMPLETADO** | Aislamiento estricto por sede                  |
| **Audit F1**    | Auditoría QA Fase 1                | ✅ **COMPLETADO** | Integridad, RLS y Esquemas validados           |
| **Audit F2-10** | Auditoría UX/Tech Core             | ✅ **COMPLETADO** | Auth, APIs y Flex validados                    |
| **Hardening**   | Refactor Inventario & SQL          | ✅ **COMPLETADO** | Catálogo unificado y dominios estandarizados   |
| **Fase 15**     | Remediación de Seguridad           | ✅ **COMPLETADO** | Refactor RLS (JWT-First) finalizado            |

**Backend refactorizado:** ✅ `tenant.service.ts` y RPC `create_sale_transaction` actualizados

### 🔄 Pendiente Inmediato

| Tarea                                     | Prioridad | Tiempo      | Responsable   |
| ----------------------------------------- | --------- | ----------- | ------------- |
| Pruebas E2E Sandbox MercadoPago           | P0        | 4h          | IA (Fase 11e) |
| Unificar `tenants.plan` → `subscriptions` | 🟡 MEDIA  | 60 min      | IA            |
| Drop de columnas legacy                   | P3        | 1-2 semanas | IA            |

### 📋 Fases Futuras

| Fase         | Descripción                                               | Prioridad | Estado            |
| ------------ | --------------------------------------------------------- | --------- | ----------------- |
| **Fase 11d** | UI final Billing (PaymentHistory + fix UpgradePlanDialog) | P0        | ✅ **COMPLETADO** |
| **Fase 11e** | Pruebas E2E con Sandbox MP                                | P0        | ⏳ Pendiente      |
| **Cleanup**  | Drop de columnas legacy                                   | P3        | ⏳ 1-2 semanas    |

---

## 🎯 PRÓXIMAS FEATURES SUGERIDAS

| Feature                         | Prioridad | Complejidad | Impacto              |
| ------------------------------- | --------- | ----------- | -------------------- |
| Pagos (MercadoPago/Stripe)      | ALTA      | Media       | Ingresos             |
| Notificaciones (n8n + WhatsApp) | ALTA      | Media       | UX                   |
| Multi-sede                      | MEDIA     | Alta        | Enterprise           |
| Reportes avanzados              | MEDIA     | Baja        | Retención            |
| i18n (Inglés/Español)           | BAJA      | Media       | Internacionalización |

---

## 🏗️ Estado del Roadmap (IMPLEMENTATION_ROADMAP.md)

| Fase    | Nombre                                           | Estado | Notas                                                    |
| ------- | ------------------------------------------------ | ------ | -------------------------------------------------------- |
| 0       | Setup y Contexto                                 | ✅     |                                                          |
| 1       | DB Migration                                     | ✅     |                                                          |
| 2       | Auth & Security                                  | ✅     |                                                          |
| 3-7     | APIs Core (Prod, Cust, Sales, Purchase, Service) | ✅     | **Core Finalizado**                                      |
| 7.5     | Flex API (Restaurantes/Retail)                   | ✅     | Notas por item + Metadata.                               |
| 8-9     | Integraciones Core & Refactor                    | ✅     | Fase 9 Completada.                                       |
| 10      | Onboarding & Notificaciones                      | ✅     | OTP & Auto-Recovery implementados.                       |
| **11**  | **Integración Financiera & MercadoPago**         | ✅     | **Cerrado**: Infraestructura y handlers. Falta UI final. |
| **E2E** | **Atomic Sales & Inventory Engine**              | ✅     | **Completado**: Motor transaccional validado.            |

---

## 📚 NUEVA DOCUMENTACIÓN CREADA (MARZO 2026)

### Para IAs de Antigravity

| Documento                 | Propósito                                                          | Ubicación                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Audit Phase 1**         | Reporte de seguridad detallado de los cimientos (Fase 1)           | `docs/security/reports/audit_report_phase1.md`                                                                                                       |
| **Audit Core Phases**     | Auditoría integral de las fases de expansión (Fases 2-10)          | `docs/security/reports/audit_report_core_phases.md`                                                                                                  |
| **QA Report F2-10**       | Reporte detallado de hallazgos técnicos y brechas de lógica        | [PHASE2_10_QA_AUDIT_REPORT.md](file:///C:/Users/Jaomart/.gemini/antigravity/brain/ba4768cb-4ece-4088-b565-5f2045dec1d6/PHASE2_10_QA_AUDIT_REPORT.md) |
| **AI Context Hub**        | Documento maestro con arquitectura, estado, prioridades y patrones | `../ARCHITECTURE_SUMMARY.md`                                                                                                                         |
| **Task Handoff Template** | Plantilla para transferir contexto entre sesiones de IAs           | `./TASK_HANDOFF_TEMPLATE.md`                                                                                                                         |
| **AI QuickStart Guide**   | Guía de inicio rápido para IAs nuevas                              | `./AI_QUICKSTART.md`                                                                                                                                 |

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

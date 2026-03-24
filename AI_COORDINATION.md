Este documento define los roles y responsabilidades de los diferentes modelos de IA que colaboran en el proyecto **Antigravity SaaS**. Su objetivo es evitar redundancias, conflictos de código y asegurar que la arquitectura se mantenga coherente, siguiendo estrictamente el [**Prompt Maestro – Coordinación de Agentes**](file:///e:/ProyectDashboard/docs/PROMPT_MAESTRO_COORDINACION.md).

> [!NOTE]
> **TABLERO ACTIVO DE TRABAJO (ESTE ARCHIVO)**
> Usa este archivo (`AI_COORDINATION.md` en la raíz) como el Kanban diario y centro de control en vivo para asignar tickets a las IAs.
> Para la documentación estática, instrucciones teóricas y Prompts Maestros, consulta la carpeta [`/docs/ai-coordination`](file:///e:/ProyectDashboard/docs/ai-coordination/).

---

## 🛠️ Roles y Capacidades

### 🛸 Antigravity (IDE Agent / Product Owner - Gemini)
**Estado:** Activo 🟢 (Control Maestro y PO)
- **Misión:** Product Owner B2B (Backlog, Validaciones, Roadmap), desarrollo activo de UI Premium, refactorización y control de calidad.
- **Acceso:** Total al IDE, sistema de archivos, terminal.
- **Responsables de:**
    - Priorizar y crear historias de usuario/tickets de corrección para los otros agentes.
    - Validar que el código cumpla con los requisitos del negocio y las `reglas-basicas.md`.
    - Generación de artefactos (`task.md`, `implementation_plan.md`, `walkthrough.md`).
    - Modificación directa de componentes cuando requiere intervención compleja.

### 🖥️ Qwen (CLI Agent)
**Estado:** Activo 🟡 (Ejecutor de Datos)
- **Misión:** Tareas pesadas de base de datos, migraciones SQL vía CLI, backfills de datos y scripts de limpieza.
- **Acceso:** CLI y archivos SQL locales.
- **Responsabilidades:**
    - Ejecución de migraciones complejas en Supabase.
    - Generación de `IMPLEMENTATION_STEPS.md` post-migración.
    - Scripts de mantenimiento de base de datos y auditoría de integridad.

### 🧪 Antigravity (Quality Engineer - Gemini)
**Estado:** Activo 🟢 (Pruebas y QA)
- **Misión:** Garantizar estabilidad, seguridad y cumplimiento mediante pruebas automatizadas y manuales.
- **Responsabilidades:**
    - Auditoría de infraestructura de pruebas (Vitest/Playwright).
    - Creación de tests de regresión para flujos críticos (E2E, RLS, Payments).
    - Mantenimiento del pipeline CI/CD de calidad.
    - Limpieza de deuda técnica referenciada por QA.

---

## 🔄 Mecanismo de Sincronización Profesional

1. **Documentación Centralizada**: Seguimiento estricto del [**Prompt Maestro – Coordinación de Agentes**](file:///e:/ProyectDashboard/docs/PROMPT_MAESTRO_COORDINACION.md).
2. **Rituales**: 
    - **Daily Standup**: Sincronización asíncrona en el chat al inicio de cada interacción.
    - **Review**: Demo al PO (Antigravity) antes de mover a `LISTO`.
3. **Definition of Done (DoD)**: Código limpio, sin `any`, RLS verificado y tests pasando.
4. **Pasaje de Estafeta**: 
    - **Qwen** -> Ejecuta SQL -> Registra en `IMPLEMENTATION_STEPS.md`.
    - **Antigravity** -> Valida contra Arquitectura -> Implementa UI/Lógica.

---

## 📋 TABLERO DE TAREAS (KANBAN AI)
*Instrucciones: El PO (Antigravity) deposita tareas aquí. Los agentes activos (Claude/Qwen/Frontend) deben tomar las tareas de `📝 TO-DO`, moverlas a `🏃 EN PROGRESO` poniendo su nombre, y al terminar pasarlas a `✅ LISTO PARA REVISIÓN`.*

### 📝 TO-DO (Prioridad Media/Baja)
4. ~~**Clean Code - Remover `console.log` de tests (P3)**~~ ✅ COMPLETADO [Antigravity QE]
   - **Nota**: Limpiado en `purchases/route.test.ts` y `sales/route.test.ts`.

5. **Fase 11 - MercadoPago Integration (P0)** — **QA VALIDADO**
   - **Acción**: Tests de regresión del webhook integrados en `src/app/api/webhooks/mercadopago/route.test.ts`.

   - Crear `PaymentHistory.tsx` + hook `use-payments.ts`.
   - Actualizar `UpgradePlanDialog` (quitar "Simulado", añadir loading state).
   - Manejar `?status=success|failure|pending` en `BillingPage`.
   - **Spec de diseño**: [BILLING_COMPONENT_SPEC.md](file:///e:/ProyectDashboard/docs/ui/BILLING_COMPONENT_SPEC.md)

6. **E2E Sandbox MercadoPago (P0)** — Siguiente sesión
   - Validar flujo: Checkout → Webhook → Suscripción actualizada → UI.

### 🏃 EN PROGRESO
- *(Vacío — tickets pasaron a TO-DO o LISTO)*

### ✅ LISTO PARA REVISIÓN (Esperando al PO)
- **Seguridad: Auditoría Integral Fases 1-10 (P0)** [Antigravity] - ✅ Reportes: `audit_report_phase1.md` y `audit_report_core_phases.md` generados.
- **Fase 11 - MercadoPago Integration & UI (P0)** [Antigravity] - ✅ Adapter, Webhook, RLS, `PaymentHistory`, `use-payments` y refactor de `BillingPage` completados.
- **Fase 13 - RLS Refinement & Granular Permissions (P0)** [Antigravity] - ✅ Auditoría + Validación completadas.
- **Security Fix - Admin Console `select('*')` (v2) (P0)** [Antigravity] - ✅ 0 instancias confirmadas.
- **🎨 UX/UI Design System — Billing (P1)** [Antigravity] - ✅ `BILLING_COMPONENT_SPEC.md` + `UX_DESIGN_SYSTEM.md`.
- **Clean Code Sesión 12b (P3)** [Antigravity] - ✅ `console.*` → `logger.*` en middleware, hooks y tests.

---
### 🏁 Sesión 12g: Fase 14 Hardening & UX Polish (23 Mar 2026)
- **Objetivo**: Inmutabilidad de metadata y localización fiscal LATAM.
- **Estado**: ✅ COMPLETADO
- **Cambios**: Triggers SQL (F14), Cost/Markup en Inventario, Express Customer en POS.
- **Próximo**: E2E Testing (Sandbox MP) y Analytics Dashboards (Fase 12).

---

## 📅 Estado de la Sesión Actual (Marzo 22, 2026)

### Sesión 12c (Senior UX/UI Designer - Antigravity) ✅ COMPLETADA
- **Tarea**: Ejecución UI de Billing (Fase 11d)
- **Logros**:
  - ✅ `PaymentHistory.tsx` + `use-payments.ts` (Historial real).
  - ✅ `UpgradePlanDialog.tsx` (Loading states + Lucide icons).
  - ✅ `BillingPage.tsx` (Manejo de estados MercadoPago + URL Cleaning).
  - ✅ `formatters.ts` (Utilidades financieras).

- ✅ Reporte generado: `docs/testing/PHASE1_QA_AUDIT_REPORT.md`.
- [x] 🎨 @Antigravity: Auditoría UX/UI - Fase 1-10 (Reporte generado en `docs/ui/FRONTEND_UX_UI_AUDIT.md`)
- [x] 🛠️ @Antigravity: Ejecución de Pulido UX (Localización FISCAL + Mejoras POS + Inventario)
- [ ] 🧪 @Antigravity: E2E Tests MercadoPago (Pendiente)

### Sesión 12f (Senior FullStack - Antigravity) ✅ COMPLETADA
- **Tarea**: Sprint de Estabilización y Optimización Post-Auditoría + Fase 14 Hardening
- **Logros**:
  - [x] Realizar Auditoría de Fases 2-10 (QA Engineer)
  - [x] Implementar Remediación de Hallazgos Core (Fases 5-8)
  - ✅ **Seguridad (Fase 14)**: Triggers de inmutabilidad de metadatos y validación de sedes activos.
  - ✅ **Middleware**: Flags de depuración restringidos a entornos no-producción.
  - ✅ **Seguridad**: Reportes de auditoría generados (`audit_report_phase1.md`, `audit_report_core_phases.md`).
  - ✅ **Seguridad**: Firmas HMAC SHA256 en webhooks de MercadoPago.
  - ✅ **Base de Datos**: Columnas `identification_type/number` y `city` en tabla `customers`.
  - ✅ **Arquitectura**: Consolidación definitiva del **Repository Pattern** en Clientes.
  - ✅ **Clean Code**: Reducción drástica de tipos `any` en `TenantService`.

### Próximos Pasos (Siguiente Sesión)
1. **Fase 11e** — Pruebas E2E completas con MercadoPago Sandbox (Checkout real).
2. **Phase 12** — Analytics Dashboards adicionales.

### Estado Actualizado
- **Antigravity**: ✅ Ejecución de código Fase 11d completada.
- **Qwen**: ✅ Fix de redirección completado - Listo para Fase 11
- **Claude**: Auditoría v4.6.0 completada, pendiente revisión de integración MercadoPago

---

## 🔒 Marcos de Seguridad y Cumplimiento (Obligatorio)

Cualquier cambio en la arquitectura, base de datos o middleware **DEBE** alinearse con:
1. [**Security Quick Reference**](file:///e:/ProyectDashboard/docs/SECURITY_QUICK_REFERENCE.md): Guía rápida para ejecución inmediata.
2. [**Security Playbook – SaaS Multi-Tenant**](file:///e:/ProyectDashboard/docs/SECURITY_PLAYBOOK_SaaS.md): Marco integral (ISO 27001, NIST, OWASP, Xygeni).
3. [**SECURITY_CHECKLIST.md**](file:///e:/ProyectDashboard/docs/SECURITY_CHECKLIST.md): Verificación técnica detallada.

---

> [!IMPORTANT]
> Antes de que cualquier agente inicie una nueva tarea, **DEBE** leer:
1. `PARA_CONTINUAR.md` (resumen rápido)
2. `docs/SESSION_HANDOFF_MARZO_15.md` (detalle de lo hecho)
3. `docs/CONTEXTO_DEL_PROYECTO.md` (contexto general)
4. `docs/SECURITY_QUICK_REFERENCE.md` (referencia rápida de seguridad)

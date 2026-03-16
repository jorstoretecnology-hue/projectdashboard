# 🤖 PROTOCOLO DE COORDINACIÓN MULTI-AGENTE (AI SYNC)

Este documento define los roles y responsabilidades de los diferentes modelos de IA que colaboran en el proyecto **Antigravity SaaS**. Su objetivo es evitar redundancias, conflictos de código y asegurar que la arquitectura se mantenga coherente.

---

## 🛠️ Roles y Capacidades

### 🛸 Antigravity (IDE Agent - Gemini)
**Estado:** Activo 🟢 (Control Maestro)
- **Misión:** Desarrollo activo, implementación de UI Premium con Stitch, refactorización de código y mantenimiento de la documentación técnica.
- **Acceso:** Total al sistema de archivos, terminal y herramientas de navegación Web.
- **Responsables de:**
    - Generación de artefactos (`task.md`, `implementation_plan.md`, `walkthrough.md`).
    - Modificación de componentes React/Next.js.
    - Sincronización de la arquitectura según `ARCHITECTURE_SUMMARY.md`.

### 🖥️ Qwen (CLI Agent)
**Estado:** Activo 🟡 (Ejecutor de Datos)
- **Misión:** Tareas pesadas de base de datos, migraciones SQL vía CLI, backfills de datos y scripts de limpieza.
- **Acceso:** CLI y archivos SQL locales.
- **Responsabilidades:**
    - Ejecución de migraciones complejas en Supabase.
    - Generación de `IMPLEMENTATION_STEPS.md` post-migración.
    - Scripts de mantenimiento de base de datos y auditoría de integridad.

### 🧠 Claude (Web/Architect Agent)
**Estado:** Pasivo 🔵 (Consultor de Arquitectura)
- **Misión:** Auditoría técnica externa, validación lógica de alta complejidad y diseño de seguridad (Hardening).
- **Acceso:** Análisis de archivos vía Web UI (Contexto subido por el usuario).
- **Responsabilidades:**
    - Generación de reportes de seguridad y optimización.
    - Revisión visual de capturas de pantalla de la UI.
    - Diseño de lógica de negocio compleja (ej. Pricing Vertical).

---

## 🔄 Mecanismo de Sincronización

1. **Documento Maestro**: Antigravity mantiene `CHANGELOG.md` y `ARCHITECTURE_SUMMARY.md` como la verdad absoluta del estado del proyecto.
2. **Pasaje de Estafeta**:
    - Si **Qwen** ejecuta SQL, debe actualizar `IMPLEMENTATION_STEPS.md`.
    - Si **Claude** sugiere un cambio estructural, **Antigravity** debe validarlo contra la arquitectura actual antes de implementar.
3. **Conflictos**: Si dos agentes sugieren soluciones distintas, **Antigravity** tiene la prioridad de decisión final para asegurar que la UI y el middleware no se rompan.

---

## 📅 Estado de la Sesión Actual (Marzo 15, 2026)

### Sesión Mañana (CLI Agent - Qwen) ✅ COMPLETADA
- **Tarea**: Fix de redirección automática a `/onboarding`
- **Problema**: Usuarios no autenticados eran redirigidos a onboarding en lugar de `/auth/login`
- **Solución**: 
  - Modificado `src/app/page.tsx` para redirigir a `/auth/login`
  - Agregados bypasses `?force_login=1` y `?bypass_onboarding=1` en `post-auth` y `middleware`
  - Documentación creada: `docs/DEBUG_BYPASSES.md`, `docs/SESSION_HANDOFF_MARZO_15.md`
- **Estado**: ✅ Fix aplicado - Pendiente verificación en producción
- **Archivos modificados**: `src/app/page.tsx`, `src/app/post-auth/page.tsx`, `src/middleware.ts`

### Próximos Pasos (Siguiente Sesión)
1. **Verificar fix** - Reiniciar servidor y probar flujos de login
2. **Fase 11** - Integración con MercadoPago (pricing + pasarela de pagos)
3. **Ejecutar migraciones SQL** - `20260314000000_activate_modules_for_tenants.sql` en Supabase

### Estado Actualizado
- **Antigravity**: Pendiente revisión UI de billing y integración de pagos
- **Qwen**: ✅ Fix de redirección completado - Listo para Fase 11
- **Claude**: Auditoría v4.6.0 completada, pendiente revisión de integración MercadoPago

> [!IMPORTANT]
> Antes de que cualquier agente inicie una nueva tarea, **DEBE** leer:
> 1. `PARA_CONTINUAR.md` (resumen rápido)
> 2. `docs/SESSION_HANDOFF_MARZO_15.md` (detalle de lo hecho)
> 3. `docs/CONTEXTO_DEL_PROYECTO.md` (contexto general)

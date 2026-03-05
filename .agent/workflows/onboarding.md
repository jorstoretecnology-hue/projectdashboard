---
description: Protocolo de inicio de sesión - Leer primero para entender el estado del proyecto
---

# 🚀 Onboarding Rápido

Este workflow define qué hacer AL INICIO de cada sesión de trabajo con el proyecto Smart Business OS.

## Paso 1: Leer el estado actual
Lee `docs/PROGRESS_TRACKER.md` — contiene:
- Qué se hizo en la última sesión
- Cuál es el próximo paso concreto
- Qué fase del roadmap está activa
- Inventario de lo que existe vs lo que falta
- Decisiones técnicas que ya fueron tomadas (ej: Next.js, no NestJS)

## Paso 2: Entender la arquitectura si es necesario
Si necesitas contexto más profundo, lee en este orden:
1. `docs/MASTER_CONTEXT.md` → Índice maestro de toda la documentación
2. `docs/IMPLEMENTATION_ROADMAP.md` → Plan de ejecución por fases
3. El documento específico que necesites según la tarea

## Paso 3: Al finalizar la sesión SIEMPRE
1. Actualizar `docs/PROGRESS_TRACKER.md`:
   - Sección "🔄 Última Actualización" (fecha, qué se hizo, próximo paso)
   - Tabla "Estado del Roadmap" si alguna fase cambió
   - "Inventario Técnico" si se crearon archivos/tablas nuevas
2. Actualizar `CHANGELOG.md` si aplica
3. Hacer commit descriptivo

## Reglas Inmutables
- **Stack**: Next.js 16 (App Router) + Supabase + Zod + Vitest + TailwindCSS
- **Idioma UI**: Español
- **Multi-tenant**: TODO debe filtrar por `tenant_id`
- **Roles**: Usar `app_role` (NO `role`)
- **Validación**: Zod (NO class-validator)
- **API**: Next.js API Routes bajo `/api/v1/` (NO NestJS)

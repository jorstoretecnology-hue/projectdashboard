# 🧠 Guía Maestra de Contexto (MASTER_CONTEXT.md)

Este documento es el punto de partida para cualquier sistema de IA o desarrollador. Define la jerarquía de los pilares fundamentales de la documentación.

---

## 📊 0. Estado Actual del Proyecto
- [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md): **Lee esto PRIMERO**. Estado actual, inventario técnico, qué falta, próximos pasos.
- [CHANGELOG.md](../CHANGELOG.md): Historial completo de todos los cambios por versión.

## 🌓 1. Estrategia y Visión
1. [PRODUCT_STRATEGY.md](./PRODUCT_STRATEGY.md): **El "Por qué"**. Identidad, Visión, Alcance del MVP y Modelo de Precios.
2. [ROADMAP_12M.md](./ROADMAP_12M.md): **El "Cuándo"**. Fases de ejecución y prioridades temporales.

## 🏗️ 2. Arquitectura y Motores
3. [ARCHITECTURE.md](./ARCHITECTURE.md): **El "Cómo" Técnico**. Stack, Estándares de calidad y Capas de Resiliencia.
4. [AUTOMATION_ENGINE.md](./AUTOMATION_ENGINE.md): **El Corazón**. Filosofía de automatización, Triggers y flujo de ejecución.
5. [COMMUNICATION_SYSTEM.md](./COMMUNICATION_SYSTEM.md): **La Salida**. Sistema multi-proveedor y motor de plantillas seguras.
6. [FISCAL_INTEGRATION_FUTURE.md](./FISCAL_INTEGRATION_FUTURE.md): **La Frontera**. Estrategia de integración con facturadores externos.

## 🛠️ 3. Implementación y Negocio
7. [MODULE_BLUEPRINT.md](./MODULE_BLUEPRINT.md): **El Manual de Construcción**. Patrón estándar para crear nuevos módulos.
8. [INDUSTRIES_ENGINE.md](./INDUSTRIES_ENGINE.md): **La Personalización**. Adaptación dinámica por vertical de industria.
9. [BUSINESS_FLOWS.md](./BUSINESS_FLOWS.md): **Los Flujos**. Procesos operativos end-to-end (ventas, compras, servicios).
10. [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md): **Los Permisos**. Roles, jerarquías y restricciones por módulo.
11. [DOMAIN_STATES.md](./DOMAIN_STATES.md): **Los Estados**. Máquinas de estado de cada entidad de negocio.

## 🔧 4. Ejecución Técnica
12. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md): **La Base**. Esquema completo de Supabase con RLS, triggers y migraciones.
13. [API_SPECIFICATION.md](./API_SPECIFICATION.md): **El Contrato**. Endpoints REST, autenticación, payloads y errores.
14. [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md): **Las Conexiones**. WhatsApp (Meta), Email (Resend), Proveedores Fiscales.
15. [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md): **La Seguridad**. OWASP, RLS, RBAC, encriptación, auditoría.

## 🚀 5. Operaciones
16. [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md): **El Plan**. Fases de ejecución, tests críticos y criterios de éxito.

---

## 🤖 Guía Rápida para la IA:
- **Para empezar**: Lee `PROGRESS_TRACKER.md` → te dice exactamente dónde quedó todo.
- **Para entender el negocio**: Lee `PRODUCT_STRATEGY.md`.
- **Para desarrollar código**: Sigue `IMPLEMENTATION_ROADMAP.md` y usa el patrón de `MODULE_BLUEPRINT.md`.
- **Para validar seguridad**: Consulta `SECURITY_CHECKLIST.md`.
- **Regla Inmutable**: Todo desarrollo debe ser Multi-tenant y respetar las políticas RLS de Supabase.
- **Stack**: Next.js 16 (App Router) + Supabase + Zod + TailwindCSS + Vitest.

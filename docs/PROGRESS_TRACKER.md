# 📊 Progress Tracker (PROGRESS_TRACKER.md)

> **⚠️ DOCUMENTO VIVO — Actualizar al final de CADA sesión de trabajo.**
>
> Este documento es la fuente de verdad del estado actual del proyecto.
> Cualquier IA o desarrollador DEBE leerlo al inicio de cada sesión.

---

## 🔄 Última Actualización

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-03-04 |
| **Versión actual** | 4.0.0 (Security & Architecture Hardening) |
| **Fase activa del Roadmap** | Fase 10 (Onboarding & Seguridad) |
| **Qué se hizo esta sesión** | **Auditoría Técnica Completa**: Se ejecutaron las Fases 1 (Seguridad DB) y 2 (Arquitectura & Server Actions). Se remediaron fallos de aislamiento RLS, inyección de tenantId, falta de validación Zod y se desacoplaron los servicios mediante Inyección de Dependencias. Se corrigió el Portal Público de Seguimiento. |
| **Próximo paso concreto** | **Fortalecimiento de Tipado**: Generar `database.types.ts` completo una vez se obtenga el token de Supabase y migrar todos los modelos de dominio para eliminar el uso de `any`. |

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
| 10 | Onboarding & Notificaciones (n8n) | 🟡 | En planificación. |

---

## 🔑 Decisiones Técnicas Importantes
- **JSONB Metadata**: Se añadió una columna `metadata` en `sales` para guardar información variable (Mesa, Mesero, PAX) sin cambiar el esquema.
- **Item Level Instructions**: `sale_items` ahora tiene `notes` para instrucciones de preparación (KDS).

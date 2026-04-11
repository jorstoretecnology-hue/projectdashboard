# DECISIONS.md — Registro de Decisiones Técnicas

---

## [2026-04-04] Unificación sistema de módulos — eliminación de MODULES_CONFIG

**Problema detectado:**
El Sidebar consumía `MODULES_CONFIG` (configuración estática hardcodeada),
mientras `ModuleContext` consumía `MODULE_DEFINITIONS` (driven por Supabase DB).
La desincronización causaba que módulos activos en `tenant_modules` no
aparecieran en el menú del dashboard. Adicionalmente, `buildActiveModules()`
retornaba todos los módulos del registry con `status ACTIVE/INACTIVE` en lugar
de retornar únicamente los módulos activos, lo que hacía que el filtro
`status === 'ACTIVE'` en el Sidebar encontrara pocos o ningún resultado.

**Causa raíz técnica:**
`buildActiveModules()` iteraba `Object.values(MODULE_DEFINITIONS)` (todos los
módulos) y asignaba status según si el slug estaba en el set. Al fallar
silenciosamente el fetch de `tenant_modules`, el set quedaba vacío y todos
los módulos quedaban `INACTIVE`.

**Decisión:**
1. Eliminar `MODULES_CONFIG` y su archivo fuente (`src/config/modules.ts`).
2. `buildActiveModules()` ahora itera los slugs del tenant (no el registry),
   retornando solo los módulos que corresponden a ese tenant con `status: 'ACTIVE'`.
3. Agregar `buildAllModulesWithStatus()` para uso exclusivo del panel `/console`.
4. El Sidebar consume exclusivamente `ModuleContext`. Sin hardcoding de módulos.
5. `IconRenderer` resuelve dinámicamente los iconos Lucide desde su nombre string.

**Regla que queda vigente:**
Los módulos visibles en el menú son 100% controlados por la tabla
`tenant_modules` en Supabase. Cualquier cambio de visibilidad se hace
desde la DB, nunca desde el frontend.

**Funciones del registry y su uso permitido:**
- `buildActiveModules()`        → Sidebar, navegación cliente. Solo módulos ACTIVE.
- `buildAllModulesWithStatus()` → Panel `/console` superadmin. Todos con status real.
- `useModuleContext()`          → Cualquier componente que necesite saber si un
                                  módulo está activo (`isModuleActive('slug')`).

**Archivos modificados:**
- `src/core/modules/module-registry.ts` — refactorizado completo
- `src/components/layout/Sidebar.tsx` — nuevo, consume ModuleContext
- `src/components/layout/Sidebar.test.tsx` — mocks actualizados
- `src/components/layout/CommandSearch.tsx` — migrado a useModuleContext
- `src/app/(admin)/console/page.tsx` — usa MODULE_DEFINITIONS
- `src/app/(app)/page.tsx` — usa MODULE_DEFINITIONS
- `src/app/(app)/dashboard/page.tsx` — usa useModuleContext
- `src/config/tenants.ts` — comentario actualizado
- `src/config/modules.ts` — **ELIMINADO**

---

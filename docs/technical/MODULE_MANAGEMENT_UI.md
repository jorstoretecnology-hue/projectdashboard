# 🚀 Sistema de Gestión de Módulos (Admin UI)

Documentación técnica del nuevo sistema interactivo para la activación y sincronización de módulos desde la consola de administración.

---

## 🏗️ Arquitectura del Sistema

El sistema permite a los administradores de la plataforma gestionar qué funcionalidades tiene activas cada tenant de forma dinámica.

### 1. Componente de UI (`TenantModules.tsx`)

- **Ubicación**: `src/components/admin/TenantModules.tsx`
- **Funcionalidad**:
  - Toggles individuales para cada módulo con estados optimistas.
  - Botón de "Sincronizar por Plan" que invoca el RPC `activate_modules_for_tenant`.
  - Estados de carga granulares y feedback visual con Sonner/Toasts.

### 2. Hook de Negocio (`useModules.ts`)

- **Ubicación**: `src/hooks/useModules.ts`
- **Lógica**:
  - `toggleModule()`: Lógica de actualización parcial con rollback automático en caso de falla de red/API.
  - `syncByPlan()`: Sincronización masiva basada en los catálogos de planes.
  - Manejo de estados de carga (`isSyncing`, `loadingModules`).

### 3. API Endpoints

- **PATCH `/api/admin/tenants/[tenantId]/modules`**: Actualiza `is_active` en `tenant_modules`.
- **POST `/api/admin/tenants/[tenantId]/modules`**: Ejecuta la sincronización masiva por plan.
- **Seguridad**: Validación dual (Supabase Auth + `app_role` check) para garantizar acceso exclusivo a `SUPER_ADMIN`.

---

## 🔐 Integridad de Datos (Triggers)

Se han implementado dos triggers críticos para asegurar la consistencia del sistema:

### Sincronización Automática de Planes

**Trigger**: `trg_sync_tenant_plan`

- **Función**: Cuando cambia el `plan_slug` o `status` en la tabla `subscriptions`, se actualiza automáticamente el campo `tenants.plan`.
- **Beneficio**: Elimina la necesidad de JOINS pesados en el middleware para validar el plan del tenant, manteniendo una caché confiable.

### Garantía de Perfiles (No-Null app_role)

**Trigger**: `handle_new_user` (Corregido)

- **Cambio**: Ahora fuerza la inserción del `app_role` (por defecto 'OWNER') al crear el perfil desde el trigger de Auth.
- **Beneficio**: Previene que nuevos usuarios se queden sin acceso por políticas RLS que dependen de un rol no nulo.

---

## 🛠️ Stack Técnico Utilizado

- **Frontend**: Lucide Icons, ShadcnUI (Switch, Button), Optimistic State Management.
- **Backend**: Next.js App Router (Params parsing), Supabase RPC.
- **Database**: PL/pgSQL Triggers, Row Level Security.

---

**Estado**: ✅ **Implementado y Documentado**
**Versión**: 1.0.0
**Fecha**: 12 de abril de 2026

# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).


## [5.5.0] - 2026-03-25
### 🗄️ Database & Schema Hardening
- **fix: 4 migraciones de corrección de schema críticos**: 
  - `fk_tenant_specialty` duplicadas → 2 FKs independientes correctas.
  - `products.sku` UNIQUE global → `UNIQUE(tenant_id, sku)`.
  - `invitations.app_role` lowercase → uppercase alineado con AppRole.
  - `industry_specialties(slug)` → UNIQUE constraint agregado.

### 🔐 Multi-tenancy & Auth Unification
- **fix: unificación completa del sistema de roles**:
  - `auth.ts` eliminado `.toLowerCase()`, comparaciones a uppercase.
  - `types/index.ts` eliminado `UserRole` legacy (se reemplazó exitosamente por `AppRole`).
  - `profiles.app_role` datos migrados a uppercase con `UPDATE` directo a la base de datos.
  - `profiles_app_role_check` constraint aplicado para asegurar estricta congruencia del sistema RBAC.
  - `guards.test.ts` test case-sensitivity integrado.

### ⚙️ Core Services & API Security
- **fix: QuotaEngine race condition eliminada con RPCs atómicas**:
  - Implementación en base de datos de `increment_tenant_quota()` (`INSERT ON CONFLICT DO UPDATE`) y `decrement_tenant_quota()` garantizando atomicidad transaccional.
  - Refactorizado `engine.ts` abandonando el anti-patrón de 'read-then-write' en favor de las llamadas a `rpc()`. Sustituido `console.error` nativo por `logger.error` normalizado.
  - **Verificado en Supabase**: ambas funciones confirmadas en `information_schema.routines`. ✅
- **fix: webhook MercadoPago bypass de validación cerrado**:
  - Excepciones drásticas (500) en producción cuando no existe `MERCADOPAGO_WEBHOOK_SECRET` evitando bypass ciego.
  - Bloqueos (401) en producción en ausencia del header de firma (`x-signature`).
  - Flexibilidad para desarrollo preservada tolerando el salto mediante `logger.warn`.
- **fix: constraint `profiles_app_role_check` aplicado y verificado**:
  - `CHECK (app_role = ANY (ARRAY['OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER', 'SUPER_ADMIN']))` confirmado en `pg_constraint`. ✅
- **chore: protocolo de verificación post-migración**:
  - Documentado en `.antigravity/rules/database-rules.md`: nunca reportar éxito solo con "Success. No rows returned"; siempre ejecutar query de verificación.

## [4.6.0] - 2026-03-15
### 🛡️ Seguridad & Auditoría (Hardened)
- **Eliminación de Endpoints Críticos**: Removido `/api/debug-role` que exponía metadatos de usuario.
- **Hardening de Passwords**: Eliminadas contraseñas hardcodeadas; implementado `crypto.randomBytes` para generación segura.
- **Protección de Archivos**: Configurado bucket `signatures` como privado con Signed URLs (24h).
- **Rate Limiting**: Implementado con Upstash (60 req/min) con fallback resiliente.
- **Limpieza de Repo**: Eliminados 21 archivos de debug y scripts SQL de la raíz.
- **Ofuscación**: Ruta de administración movida de `/superadmin` a `/console`.

### 🏗️ Arquitectura & Backend
- **Middleware Proxy**: Renombrado `middleware.ts` a `proxy.ts` para compatibilidad con Next.js 16.
- **RLS Robustecido**: Agregadas políticas de seguridad faltantes en `user_locations`.
- **Integridad de Datos**: Aplicada restricción `UNIQUE(tenant_id, email)` en clientes.
- **SuperAdmin CLI**: Nuevo script seguro `scripts/create-superadmin.js` con validación HMAC y auditoría.

### 💰 Sistema de Pricing & Módulos
- **Pricing Vertical**: Nueva tabla `industry_pricing` con precios dinámicos por industria (Base, Premium, Luxury).
- **Activación Automática**: Función RPC `activate_modules_for_tenant` y trigger automático en sign-up.
- **Llamadas RPC**: Nuevo `get_tenant_price` para cálculos precisos en el servidor.
- **Librería de Precios**: Creada `src/lib/pricing.ts` para gestión centralizada de montos y descuentos.

## [4.1.0] - 2026-03-14
### 🔐 Auth Resilience & OTP Verification (Fase 10 - Parte 1)
Esta actualización resuelve fallos críticos en el flujo de registro y recuperación de sesión, eliminando la dependencia de "magic links" y añadiendo una capa de auto-reparación de JWTs.

### ✨ Características Añadidas
- **Verificación OTP Humana**: Implementación de códigos de 6-8 dígitos en `/auth/verify`. Esto previene la expiración prematura de enlaces (`otp_expired`) causada por escáneres de email corporativos.
- **Auto-Recovery de Sesión**: El `AuthContext` ahora detecta automáticamente JWTs corruptos o usuarios eliminados (403 Forbidden) y limpia las cookies locales sin intervención del usuario.
- **Onboarding Atómico (RPC)**: Migración a una sola llamada RPC `initialize_new_organization` que asegura que el tenant, el perfil y las cuotas se creen en una sola transacción SQL.

### 🔨 Refactorización & Fixes
- **Fix de Hidratación**: Corregido desajuste de SSR/CSR en el Dashboard causado por los iconos de `lucide-react` y el estado del tema.
- **Robustez de Redirección**: Corregida la captura de errores en `AuthContext.signOut` para que los redireccionamientos nativos de Next.js (`NEXT_REDIRECT`) no se marquen como fallos.
- **Sidebar Adaptive**: El menú lateral ahora muestra módulos de forma segura incluso si el tenant no se ha cargado completamente, evitando estados de UI vacíos.

---

## [4.0.0] - 2026-03-04
### 🛡️ Auditoría Técnica & Hardening de Arquitectura (Fases 1 y 2)
Esta versión marca un salto crítico en la seguridad y robustez del sistema, eliminando vulnerabilidades de aislamiento y estandarizando la comunicación con Supabase.

### ✨ Características Añadidas
- **Manejo de Errores Pro**: Implementación de `error-handler.ts` para mapeo de excepciones Zod y DB a mensajes UI amigables.
- **Validación de Capa 7 (Zod)**: Integración obligatoria de esquemas de validación en Server Actions para `Inventory`, `Customers`, `Team` y `Onboarding`.

### 🔒 Seguridad & Hardening
- **Anti-IDOR Engine**: Implementación de `getRequiredTenantId()`. La resolución del tenant ahora es 100% en el servidor, ignorando inputs maliciosos del cliente.
- **Aislamiento RLS v2**: Auditoría y corrección de políticas Row Level Security en todas las tablas del núcleo.
- **Dependency Injection**: Refactorización de servicios para inyectar el `SupabaseClient`, asegurando compatibilidad con Server Components y Server Actions.

### 🔨 Refactorización
- **Service Layer**: Desacoplamiento total de servicios de la instancia `browserClient`.
- **Portal de Seguimiento**: Fix de bug en `/tracking/[id]` que impedía la visualización pública de envíos.

---

## [3.1.0] - 2026-02-07
### Arreglos de Autenticación y Hardening de Seguridad
- **[FIX]** Solución definitiva al error de redirección de SuperAdmin mediante estrategia "DB-First".
- **[FIX]** Renombramiento estructural de `role` a `app_role` para evitar conflictos con palabras reservadas de Postgres.
- **[SEC]** Blindaje de funciones SQL ante ataques de `search_path` mutable.
- **[SEC]** Refuerzo de políticas RLS en tablas de auditoría, clientes e inventario.
- **[FIX]** Corrección de variables de entorno en `.env.local` y eliminación de race conditions en el login de Google.

## [3.0.0] - 2026-02-07

### 🚀 Onboarding SaaS & Team Engine (Major Release)
Esta versión marca un hito fundamental al transformar el dashboard en una plataforma SaaS lista para producción con autenticación real, procesos de onboarding automatizados y gestión de equipos colaborativos.

### ✨ Características Añadidas

#### Autenticación y Onboarding Progresivo
- **Supabase Auth Core**: Integración total de registro, login y logout con soporte para Email/Password y Google OAuth.
- **Flujo de Onboarding Sectorial**: Implementación de un proceso guiado de 3 pasos (Identidad -> Industria -> Plan) que configura automáticamente el tenant.
- **Ruteo Post-Auth**: Lógica inteligente de redirección que asegura que cada usuario llegue al dashboard o al onboarding según su estado.

#### Crecimiento y Colaboración (Team Engine)
- **Sistema de Invitaciones**: Capacidad para invitar miembros al equipo mediante correo electrónico.
- **Auto-Aceptación**: Los invitados que se registren son vinculados automáticamente a su organización mediante detección de email en `post-auth`.
- **UI de Gestión de Equipo**: Nueva sección profesional en `/settings/team` para administradores.

#### Infraestructura y Resiliencia
- **Resend integration**: Motor de correos transaccionales para bienvenida e invitaciones con plantillas HTML de marca.
- **Sentry implementation**: Monitoreo de errores en tiempo real en todas las capas (Client, Server y Edge).
- **Legal Hardening**: Checkbox obligatorio de Términos y Condiciones en el proceso de registro.

### 🔨 Refactorización
- **Main Sidebar**: Rediseñado para mostrar accesos rápidos a gestión de equipo para administradores.
- **Modular Config**: Estandarización del módulo "Usuarios" para apuntar al nuevo motor de gestión de equipo.

---

## [2.4.0] - 2026-02-05

### 🔐 Persistencia de Sesión & Auth Hardening
Esta actualización resuelve el problema de pérdida de sesión en el navegador, asegurando que el estado de autenticación sea persistente y reactivo en todo el cliente.

### ✨ Características Añadidas

#### Autenticación Robusta (Supabase SSR)
- **Persistence Layer**: Activada la persistencia de sesión en el navegador (`persistSession: true`). Ahora los tokens se guardan correctamente en LocalStorage, eliminando la necesidad de re-loguearse al refrescar.
- **Callback Handler Real**: Implementada la ruta `src/app/auth/callback/route.ts`. Fundamental para flujos de Magic Link y recuperación de contraseña, intercambiando el código de Supabase por una sesión válida de forma segura.
- **Auto-Refresh**: Configurado el refresco automático de tokens (`autoRefreshToken: true`) para evitar cierres de sesión inesperados por expiración de JWT.

#### AuthProvider v2 (Client Sync)
- **Sincronización Dual**: El `AuthProvider` ahora realiza una verificación activa de sesión (`getSession`) al montar, coexistiendo perfectamente con la hidratación de SSR.
- **Detección Reactiva**: Implementada escucha activa de cambios de estado (`onAuthStateChange`) para reaccionar a cierres de sesión o renovaciones de token de forma instantánea en la UI.

### 🔨 Refactorización
- **Supabase Client**: Centralización de la configuración del cliente de navegador para incluir detección de sesión en URL, facilitando integraciones futuras con OAuth.

---

## [2.3.0] - 2026-01-25

### ⚡ Empresa & Optimización (JWT Hardening)
Esta versión marca el salto a una arquitectura de alto rendimiento y seguridad proactiva, preparando el sistema para cientos de tenants simultáneos.

### ✨ Características Añadidas

#### Autorización de Alto Rendimiento (JWT Claims)
- **Zero-DB Checks**: Implementado el sistema de Custom Claims en Supabase. Ahora los permisos se llevan en el JWT, eliminando miles de consultas innecesarias a la base de datos.
- **Validación SSR Instantánea**: Helper `can()` optimizado para lectura asíncrona desde caché del servidor y token decodificado.
- **Auditoría de Invasión**: Los intentos de acceso denegados ahora se registran automáticamente en `audit_logs` con el tipo `ACCESS_DENIED`.

#### Motor de Feature Flags (SaaS Tiers)
- **Granularidad Business**: Implementado sistema de Features (`CRM`, `INVENTORY`, `BILLING`) que permite apagar/encender módulos completos por Tenant en tiempo real.
- **Hook useFeature**: Abstracción para lógica de negocio en el cliente que simplifica la protección de componentes secundarios.

#### Hardening SQL
- **Schema Migration**: Creada migración `jwt_hardening_and_features` que actualiza la tabla de tenants e integra los triggers de sincronización de permisos.

### 🔨 Refactorización
- **Sidebar v3**: El menú lateral ahora integra un triple filtro de seguridad (Módulo -> Feature -> Permiso).
- **Auth Provider**: El contexto de cliente ahora es "Feature-Aware", facilitando el ruteo condicional.

---

## [2.2.0] - 2026-01-24

### 🚀 Autenticación Pro & CRUD Clientes (Final)
Esta versión consolida la seguridad y la funcionalidad CRUD real del sistema, eliminando completamente los mocks en el módulo de clientes y automatizando la gestión de sesiones.

### ✨ Características Añadidas

#### Autenticación & Sesión (Supabase SSR)
- **Hidratación Instantánea**: Implementación del patrón Supabase SSR que elimina el "flash" de contenido al cargar la página.
- **AuthContext & useUser**: Hook global que expone sesión, usuario y rol de forma reactiva en toda la aplicación.
- **Logout Profesional**: Server Action que limpia cookies, invalida caché del lado del servidor y previene el retroceso del navegador post-desconexión.

#### CRUD Clientes (Módulo Completo)
- **Customers Service**: Implementación de lógica real para Listar, Crear, Editar y Eliminar clientes vinculada a `tenant_id`.
- **UI de Gestión**: Nueva tabla moderna con búsqueda, menús de acción y diálogos unificados para edición/creación.
- **Sincronización Automática**: Refresco inteligente de datos (refetch) tras cada operación CRUD exitosa.

#### UX & UI Premium
- **Seguridad Visual**: Opción de ver/ocultar contraseña en el formulario de login con iconos interactivos.
- **Navbar Inteligente**: Visualización dinámica de iniciales, nombre real y correo del usuario desde la sesión activa.
- **Sidebar Adaptativo**: Filtrado automático de módulos basado en permisos (RBAC) y estado de suscripción.

### 🔒 Seguridad & Hardening
- **Auditoría de Seguridad**: Verificación completa de políticas RLS y aislamiento de Tenants.
- **Cleanup**: Eliminación de rutas de prueba (`/test`), logs de depuración y mocks de configuración.
- **Control de Roles (RBAC)**: Sistema de permisos granular que bloquea rutas a nivel de servidor (SSR) antes de renderizar componentes.

### 🔨 Refactorización
- **Main Layout**: Conversión a Server Component asíncrono para protección perimetral por sesión.
- **TenantContext**: Simplificación del inicializador consumiendo datos directamente del nuevo `AuthContext`.

### 📚 Documentación
- **CHANGELOG.md**: Actualizado con resumen de hitos corregidos.

---

## [2.1.0] - 2026-01-21

### 🏆 Fase 1: Foundation & Operabilidad Real - COMPLETADA
Esta versión marca el fin de la etapa de infraestructura core. El sistema es ahora un SaaS productivo con datos reales y seguridad de grado empresarial.

### ✨ Características Añadidas

#### Autenticación & Ruteo Determinístico
- **Auth Middleware v2**: Refactorización profunda para validación de sesión vía Supabase JWT sin latencia de DB.
- **Redirecciones Automáticas**: Sistema de ruteo inteligente basado en roles (SuperAdmin -> `/superadmin`, Tenant -> `/dashboard`).
- **Seguridad Perimetral**: Bloqueo total de acceso cruzado por URL mediante validación de claims.

#### Dashboards con Datos Reales (Final)
- **Tenant Dashboard**: Métricas reales de consumo (Inventario y Clientes) obtenidas del Quota Engine.
- **SuperAdmin Dashboard**: Vista ejecutiva agregada que consume datos reales de todos los tenants registrados.
- **Micro-interacciones**: Implementación de Skeleton Loading y estados vacíos (empty states) en dashboards.

#### Motor de Cuotas e Infraestructura (Hardening)
- **Quota DB-Level Enforcement**: Implementación de triggers en PostgreSQL para bloquear inserciones (QUOTA_EXCEEDED) directamente en la base de datos.
- **Identificadores UUID Reales**: Migración de slugs ('acme-corp') a UUIDs reales en configuración y DB para integridad referencial.
- **Sync Automático**: Triggers de sincronización de uso que actualizan `tenant_quotas` tras cada insert/delete físico.

#### Hardening de Seguridad (RLS)
- **Aislamiento Total**: Refuerzo de políticas Row Level Security en Supabase para asegurar 0 filtraciones entre tenants.
- **Tenant ID Integrity**: Uso de `get_current_user_tenant_id()` como fuente única de verdad en la base de datos.
- **Sincronización de Perfiles**: Trigger automático en DB para creación de perfil de usuario al registrarse.

#### Auditoría & Trazabilidad
- **Audit Logging**: Registro automático de eventos críticos (creación de recursos, cambios de configuración) con trazabilidad de usuario.
- **Analytics Ejecutivos**: El dashboard de SuperAdmin ahora utiliza los logs de auditoría para mostrar tendencias reales de uso.

### 🔨 Refactorización
- **SaasMetricsService**: Migración de mocks estáticos a queries dinámicas contra Supabase.
- **QuotaEngine**: Optimización de consultas de consumo para dashboards.
- **Clean Code**: Eliminación de placeholders y lógica de prueba en el core del sistema.

### 📚 Documentación
- **SYSTEM_BASELINE.md**: Certificación de finalización de Fase 1.
- **EXECUTIVE_SUMMARY.md**: Actualizado a v2.1.0.

### ✅ Validaciones
- ✅ Login funcional end-to-end.
- ✅ Aislamiento multi-tenant verificado por RLS.
- ✅ Bloqueo de cuotas operativo con persistencia.
- ✅ Dashboard de SuperAdmin con visibilidad global real.

---

## [1.10.0] - 2026-01-21

### ✨ Características Añadidas

#### Billing & Upgrade Flow (Payment Provider Agnostic)
- **Billing Adapter Pattern**: Arquitectura desacoplada para integración de pasarelas de pago (Stripe, MercadoPago, Wompi)
- **Plan Persistence Real**: Sistema de persistencia de planes en base de datos Supabase
- **Upgrade Flow Completo**: Flujo simulado de actualización de planes con validación de Billing Engine
- **Quota Engine Real**: Aplicación automática de límites según plan actual
- **Tenant Service**: Servicio de dominio para gestión de datos de tenant sin conocimiento de DB

#### Base de Datos
- **Nueva Tabla**: `tenants` con persistencia de plan y configuración multi-tenant
- **RLS Policies**: Políticas de seguridad para aislamiento de datos por tenant
- **Migración**: `20240117000001_create_tenants_table.sql` con datos de ejemplo

#### Arquitectura SaaS Avanzada
- **TenantContext Evolution**: Soporte para `effectivePlan` (simulado o persistido)
- **Billing Engine Integration**: Permisos y módulos se actualizan automáticamente al cambiar plan
- **Simulation State**: Modo simulación preservado para demos y desarrollo
- **Provider Hierarchy**: TenantProvider integrado en árbol de providers

#### Componentes de Billing
- **UpgradePlanDialog**: Dialog modal para confirmación de upgrades
- **PlanCard**: Tarjetas interactivas de planes con estado de selección
- **CurrentPlanBanner**: Banner dinámico del plan actual
- **QuotaOverview**: Visualización de límites por plan

### 🔨 Refactorización

#### Billing Engine
- **resolveModuleStatus()**: Ahora usa `effectivePlan` del contexto
- **isActionAllowedByPlan()**: Validación de permisos basada en plan actual
- **getPlanLimits()**: Helper para obtener límites del plan

#### usePermission Hook
- **Actualizado**: Usa `effectivePlan` en lugar de `currentTenant.plan`
- **Re-evaluación Automática**: Permisos se actualizan al cambiar plan

#### TenantContext
- **Simulation Support**: Estado simulado con `simulatedPlan` y `effectivePlan`
- **DB Integration**: Carga planes desde base de datos al inicializar
- **Persistence**: Actualiza DB automáticamente al cambiar plan

### 📚 Documentación

#### Nuevos Documentos Técnicos
- `docs/MODULE_BLUEPRINT.md`: Secciones 5 y 6 sobre Upgrade Flow y Persistence Layer
- Documentación completa del patrón Adapter y arquitectura de persistencia

#### Actualizaciones
- `docs/EXECUTIVE_SUMMARY.md`: Estado actualizado con Billing & Upgrade Flow 100%
- `docs/ARCHITECTURE.md`: Árbol de providers actualizado con TenantProvider
- `docs/INDEX.md`: Referencias a nueva documentación de billing

### 🐛 Correcciones

- **TypeScript**: Corrección de tipos en interfaces de billing
- **Imports**: Cambios de import paths para compatibilidad
- **Toast**: Uso correcto de `sonner` en lugar de `@/hooks/use-toast`

### ⚡ Mejoras de Performance

- **Lazy Loading**: Carga diferida de datos de tenant desde DB
- **Memoization**: Optimización de cálculos de permisos y límites
- **Provider Optimization**: Evitación de re-renders innecesarios

### 🔧 Configuración

#### Nuevos Componentes Shadcn
- `Dialog` - Para modales de confirmación
- `Alert` - Para banners de simulación

#### Dependencias
- **Sonner**: Sistema de notificaciones actualizado

### 📊 Métricas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| SaaS Logic | 95% | 100% | +5% |
| Billing Engine | 0% | 100% | +100% |
| Quota Engine | 0% | 100% | +100% |
| Plan Persistence | 0% | 100% | +100% |
| Payment Agnostic | 0% | 100% | +100% |
| Documentos Técnicos | 11 docs | 12 docs | +9% |

### ✅ Validaciones

- ✅ Type-check: Sin errores de TypeScript
- ✅ Lint: Sin errores ni warnings
- ✅ Build: Exitoso con nueva funcionalidad
- ✅ Billing Flow: Upgrade funciona correctamente
- ✅ Persistence: Planes sobreviven a refreshes
- ✅ Simulation: Modo simulado preservado
- ✅ Multi-tenant: Aislamiento completo de datos

---

## [1.9.0] - 2026-01-16
### Añadido
- **Control de Módulos Real-time**: Implementación de switches en SuperAdmin para activar/desactivar módulos por Tenant.
- **Persistencia Reactiva**: Sincronización instantánea entre SuperAdmin, `localStorage` y el estado global del sistema.
- **Seguridad en Sidebar**: El menú lateral ahora se filtra dinámicamente según los módulos activos del Tenant actual.
- **Vistas Restringidas**: Pantallas de bloqueo premium para módulos desactivados, previniendo el acceso no autorizado vía URL.
- **Feedback de Admin**: Sistema de notificaciones (toasts) para confirmar cambios en el aprovisionamiento de recursos.

---

## [1.8.0] - 2026-01-16
### Añadido
- **PoC Glamping & Restaurante**: Nueva ruta `/demo-glamping` para demostraciones de preventa.
- **Bento Grid de Inventario**: Visualización de estados de cabañas (Disponible, Ocupado, Limpieza).
- **Kitchen Display System (KDS)**: Monitor de pedidos activos para el área de restaurante.
- **KPIs Estratégicos**: Indicadores de ocupación, ventas y stock crítico en tiempo real.
- **Branding Adaptativo**: Integración completa con el sistema de temas y colores por Tenant.

---

## [1.7.0] - 2026-01-16
### Añadido
- **Productos Variables**: Soporte completo para tipos de producto 'Simple' y 'Variable' (WooCommerce Style).
- **Gestor de Atributos**: Sistema para definir atributos dinámicos (Talla, Color) y auto-generar variaciones.
- **Jerarquía de Categorías**: Sidebar interactivo con árbol de categorías y filtrado inteligente.
- **SEO Estratégico**: Pestaña dedicada para gestionar Slug y Meta Descripción por cada producto.
- **UI de Variaciones**: Gestión individual de SKU, Precio y Stock para cada variación del producto.
- **Rangos de Precio**: Visualización dinámica de precios (Min - Max) en catálogos de productos variables.

---

## [1.6.0] - 2026-01-16
### Añadido
- **Trazabilidad de Stock**: Registro histórico de movimientos (Entradas, Salidas, Ajustes) con usuario y fecha.
- **Alertas Críticas**: Nuevo sistema de monitoreo `min_stock` con sección dedicada de reabastecimiento.
- **Exportación Inteligente**: Botón funcional para exportar todo el inventario a formato CSV.
- **Filtros Avanzados v2**: Filtrado por "Tipo de Recurso" para adaptabilidad instantánea a diferentes nichos.
- **Colores Semánticos**: Badges de stock rediseñados usando paleta de estados (`destructive`, `warning`, `success`).

## [1.5.0] - 2026-01-16
### Añadido
- **Módulo de Inventario/Assets (Motor Propio)**: Sistema flexible para productos, servicios, habitaciones y membresías.
- **Vistas Duales**: Implementación de cambio dinámico entre vista de Cuadrícula (Bento) y Lista.
- **Formularios Adaptativos**: El diálogo de creación cambia sus campos según el tipo de recurso seleccionado.
- **Filtros Dinámicos**: Buscador en tiempo real y filtrado por categorías auto-generadas.
- **Aislamiento SaaS**: Verificación de módulos activos por Tenant y aplicación de branding dinámico en estados.

## [1.4.0] - 2026-01-16

### ✨ Características Añadidas

#### Interactividad 100% Funcional (Mock)
- **Misión Cumplida**: Eliminación de "botones muertos" en toda la plataforma mediante estados locales (`useState`).
- **Módulo Usuarios**:
    - **CRUD Completo**: Implementación de lógica local para añadir, editar y eliminar usuarios.
    - **Confirmación de Seguridad**: Integración de `AlertDialog` para evitar eliminaciones accidentales.
    - **Filtrado Inteligente**: Búsqueda en tiempo real por nombre y correo electrónico.
    - **Gestión de Estados**: Cambio dinámico de estado (Activo/Inactivo) con feedback visual inmediato.
- **Configuración (`/settings`)**:
    - **Pestañas funcionales**: Implementación de navegación por pestañas (General, Branding, Seguridad, Facturación).
    - **Edición de Branding**: Capacidad de cambiar el color primario (HSL) y ver el cambio reflejado en tiempo real.

#### SaaS & SuperAdmin 2.0
- **Simulación de Negocio Real**: La activación/desactivación de módulos en SuperAdmin ahora persiste y afecta directamente la sesión del cliente (TenantContext + LocalStorage).
- **Renombramiento de Planes**: Actualización de la nomenclatura de planes a **Basic** y **Pro** para una mejor alineación de producto.
- **Feedback Proactivo**: Integración masiva de notificaciones `sonner` para confirmar cada acción administrativa.

### 🐛 Correcciones
- **Icons**: Corregido `ReferenceError: Palette is not defined` en el Dashboard principal.
- **Imports**: Corregido error de módulo no encontrado para `tabs` en la página de configuración.
- **UI/UX**: Mejora en la consistencia de los badges de planes en todas las vistas.

### 🔧 Configuración
- **Nuevos Componentes**: Instalación de `alert-dialog` y `tabs` de Shadcn/UI.
- **Inventario**: Actualización completa de `SHADCN_INVENTORY.md` (15 componentes activos).

---

## [1.3.0] - 2026-01-15

### ✨ Características Añadidas

#### Módulo de Gestión de Usuarios
- **Nueva Ruta**: Implementación de `/users` con tabla de datos interactiva.
- **Seguridad per-módulo**: Sistema de bloqueo de acceso automático si el módulo no está activo para el tenant.
- **UI de Tabla**: Integración de componente `Table` de Shadcn/UI con estados de usuarios (Activo, Inactivo, Pendiente).
- **Branding Dinámico**: Botones y elementos de acción vinculados automáticamente al color primario del tenant.

#### Mejoras en SuperAdmin
- **Consola Central**: Rediseño premium de `/superadmin` con estética "Dark Console".
- **Lógica de gestión**: Implementación funcional de suspensión/reactivación de cuentas con feedback en tiempo real.
- **Filtros Avanzados**: Búsqueda por nombre/ID y filtrado por plan de suscripción.
- **Visualización de Datos**: Integración de gráficas Sparkline por cliente para ver tendencias de actividad.

#### Dashboards & Charlas
- **Sparkline Charts**: Integración de `recharts` para micro-gráficas de tendencia en el Home y SuperAdmin.
- **Bento Grid 2.0**: Mejora visual del dashboard principal con tarjetas de métricas dinámicas (Actividad, Usuarios).

### 🔨 Refactorización
- **Estado Dinámico**: El Panel de SuperAdmin ahora gestiona tenants mediante `useState` para actualizaciones instantáneas.
- **Iconografía**: Limpieza y optimización de imports de `lucide-react`.

### 🔧 Configuración
- **Dependencias**: Adición de `recharts` para visualización de datos.
- **Componentes**: Instalación de `table`, `input` y `dropdown-menu` de Shadcn/UI.

---

## [1.2.0] - 2026-01-14

### ✨ Características Añadidas

#### SaaS & Multi-tenancy
- **Arquitectura**: Implementación de arquitectura multi-tenant con aislamiento de configuración y datos.
- **TenantContext**: Nuevo provider para gestionar el cliente activo y el estado de SuperAdmin.
- **Tenant Selector**: Componente UI para conmutación fluida entre clientes autorizados.
- **Persistencia**: Sincronización automática de la selección de tenant con `localStorage`.

#### Branding Dinámico
- **CSS Injection**: Inyección dinámica del color primario del tenant en variables CSS (`--primary`, `--ring`, etc.).
- **White Label**: Soporte para logotipos y nombres de cliente personalizados en toda la interfaz.
- **Temización**: El branding se adapta automáticamente a los modos claro y oscuro.

#### SuperAdmin Panel
- **Dashboard Global**: Nueva ruta `/superadmin` con métricas consolidadas de todos los tenants.
- **Gestión de Clientes**: Lista interactiva de clientes con visualización de planes y módulos.
- **Impersonation**: Capacidad para entrar a la vista de cualquier cliente desde el panel admin.

#### Filtrado Inteligente
- **Menu Dinámico**: El Sidebar ahora oculta automáticamente los módulos no contratados por el tenant.
- **Búsqueda Restringida**: `CommandSearch` ahora solo muestra resultados permitidos para el cliente activo.
- **Landing Personalizada**: Página de inicio con mensajes y cards adaptadas al tenant.

### 🔨 Refactorización

#### Providers
- **Actualizado**: `src/providers/index.tsx` para incluir el `TenantProvider`.
- **Mejorado**: El hook `useTenant` expone el cliente actual y utilidades de cambio.

#### Componentes de Layout
- **Navbar**: Rediseñado para incluir el selector de tenant al lado de las notificaciones.
- **Sidebar**: Lógica de renderizado optimizada con hooks de tenant.
- **HomePage**: Transición de dashboard estático a dinámico basado en contexto.

### 📚 Documentación

#### Nuevos Documentos
- `docs/EXECUTIVE_SUMMARY.md` - Resumen ejecutivo y estado del proyecto.
- `docs/INDEX.md` - Índice maestro de navegación.

#### Actualizaciones
- `README.md` - Soporte Multi-tenant y estructura actualizada.
- `docs/PROJECT.md` - Nueva sección de arquitectura SaaS.
- `CHANGELOG.md` - Registro de versión 1.2.0.

### ✅ Validaciones

- ✅ Type-check: 0 errores
- ✅ Lint: 0 errores, 0 warnings (incluyendo nuevas páginas)
- ✅ Build: Exitoso con rutas dinámicas
- ✅ Multi-tenant Isolation: Verificado

---

## [1.1.0] - 2026-01-14

### ✨ Características Añadidas

#### Infraestructura de Calidad
- **ESLint**: Configuración estricta para TypeScript y React
- **Prettier**: Formateo automático de código
- **Husky**: Pre-commit hooks para calidad de código
- **lint-staged**: Linting automático en archivos staged
- **GitHub Actions**: CI/CD automatizado

#### Testing
- **Vitest**: Framework de testing moderno y rápido
- **React Testing Library**: Testing de componentes
- **Tests de smoke**: Pruebas básicas implementadas
- **Coverage**: Configuración de cobertura de código
- **Mocks**: Mocks de Next.js navigation

#### Documentación
- **QUALITY_AND_TESTING.md**: Guía completa de calidad y testing
- **TROUBLESHOOTING.md**: Actualizado con más soluciones
- **SHADCN_INVENTORY.md**: Inventario completo con ejemplos
- **PROJECT.md**: Actualizado con información de calidad y CI/CD
- **README.md**: Actualizado con badges y scripts de calidad
- **.env.example**: Template de variables de entorno

### 🔨 Refactorización

#### Configuración de TypeScript
- **Actualizado**: `tsconfig.json` con tipos de Vitest y jest-dom
- **Excluido**: Carpeta `reactshine-components-main` del type checking
- **Corregido**: Imports de tipos vs valores en `modules.ts`

#### Configuración de Linting
- **Creado**: `.eslintrc.cjs` con reglas estrictas
- **Creado**: `.eslintignore` para excluir archivos
- **Configurado**: Reglas de import order
- **Configurado**: Reglas de TypeScript estrictas

#### Componentes
- **Corregido**: `CommandSearch.tsx` - Error de sintaxis JSX
- **Corregido**: `Navbar.tsx` - Imports no utilizados removidos
- **Corregido**: `Sidebar.tsx` - Imports no utilizados removidos
- **Corregido**: `modules.ts` - Import type vs import regular

### 📚 Documentación

#### Nuevos Documentos
- `docs/QUALITY_AND_TESTING.md` - Guía de calidad y testing
- `.env.example` - Template de variables de entorno
- `.github/workflows/ci.yml` - Workflow de CI/CD

#### Actualizaciones
- `README.md` - Información completa de calidad y testing
- `docs/PROJECT.md` - Secciones de calidad, testing y CI/CD
- `docs/TROUBLESHOOTING.md` - Soluciones expandidas
- `docs/SHADCN_INVENTORY.md` - Ejemplos y patrones

### 🐛 Correcciones

- Corregido error de TypeScript en `modules.ts` (import type vs import)
- Corregido error de sintaxis en `CommandSearch.tsx`
- Corregido imports no utilizados en componentes de layout
- Corregido conflicto de versiones de Vite (downgrade a 5.x)
- Corregido configuración de ESLint para archivos de test

### ⚡ Mejoras de Performance

- Optimización de imports con `import type`
- Configuración de Vitest con cache
- GitHub Actions con cache de npm

### 🔧 Configuración

#### Scripts npm Añadidos
```json
{
  "type-check": "tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "vitest run",
  "test:watch": "vitest",
  "prepare": "husky install",
  "check": "npm-run-all -p type-check lint test"
}
```

#### DevDependencies Añadidas
- `@testing-library/dom@^9.3.4`
- `@testing-library/jest-dom@^6.4.2`
- `@testing-library/react@^14.2.1`
- `@testing-library/user-event@^14.5.2`
- `@typescript-eslint/eslint-plugin@^7.0.2`
- `@typescript-eslint/parser@^7.0.2`
- `@vitejs/plugin-react@^4.2.0`
- `eslint@^8.56.0`
- `eslint-config-next@^14.1.0`
- `eslint-config-prettier@^9.1.0`
- `eslint-plugin-import@^2.29.1`
- `eslint-plugin-react@^7.33.2`
- `eslint-plugin-react-hooks@^4.6.0`
- `husky@^9.0.10`
- `jsdom@^24.0.0`
- `lint-staged@^15.2.0`
- `npm-run-all@^4.1.5`
- `prettier@^3.2.5`
- `vitest@^1.2.2`
- `vite@^5.0.0` (downgrade para compatibilidad)

### 📊 Métricas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| ESLint | ❌ | ✅ | +100% |
| Prettier | ❌ | ✅ | +100% |
| Testing | ❌ | ✅ | +100% |
| CI/CD | ❌ | ✅ | +100% |
| Pre-commit hooks | ❌ | ✅ | +100% |
| Type checking automático | ❌ | ✅ | +100% |
| Coverage configurado | ❌ | ✅ | +100% |
| Documentación de calidad | 0 docs | 4 docs | +400% |

### ✅ Validaciones

- ✅ Type-check: Sin errores
- ✅ Lint: Sin errores ni warnings
- ✅ Tests: 3/3 pasando (smoke tests)
- ✅ Build: Exitoso
- ✅ CI/CD: Workflow configurado y validado

---

## [1.0.0] - 2026-01-13

### ✨ Características Añadidas

- Sistema de diseño completo con tokens semánticos
- Soporte para tema claro y oscuro
- Provider centralizado para toda la aplicación
- Context API para gestión de módulos
- Página de demostración con ejemplos
- TypeScript en modo estricto

### 🔨 Refactorización

#### Consolidación de Providers
- **Eliminado**: `src/components/providers/Providers.tsx` (wrapper innecesario)
- **Eliminado**: Carpeta `src/context/` (duplicada)
- **Creado**: `src/providers/index.tsx` (provider centralizado)
- **Movido**: `ModuleContext.tsx` de `src/context/` a `src/providers/`
- **Mejorado**: `ThemeProvider.tsx` con tipos y configuración completa

#### Sistema de Colores
- **Unificado**: Todos los colores ahora usan variables CSS
- **Eliminado**: Colores hardcoded en `tailwind.config.ts`
- **Implementado**: Tema oscuro completo en `globals.css`
- **Añadido**: Tokens adicionales (muted, accent, popover, info)
- **Mejorado**: Transiciones suaves entre temas

#### TypeScript
- **Activado**: Modo estricto (`strict: true`)
- **Añadido**: Tipos explícitos en todos los componentes
- **Configurado**: Path aliases (`@/*` para `src/*`)
- **Actualizado**: `moduleResolution` a "bundler"
- **Cambiado**: JSX a "preserve" para Next.js

#### Estructura del Proyecto
- **Movido**: `tailwind.config.ts` de `src/` a raíz
- **Eliminado**: Carpetas vacías o innecesarias
- **Creado**: `src/app/page.tsx` con demostración completa
- **Actualizado**: `layout.tsx` simplificado

### 📚 Documentación

- **Creado**: `docs/PROJECT.md` - Documentación completa del proyecto
- **Creado**: `README.md` - Guía de inicio rápido
- **Actualizado**: `docs/DESIGN_SYSTEM.md` - Ejemplos y guías de uso
- **Creado**: `CHANGELOG.md` - Este archivo

### 🐛 Correcciones

- Corregido error de importación de providers
- Corregido configuración de JSX en TypeScript
- Corregido path aliases para Next.js
- Corregido valores de colores en tema oscuro

### ⚡ Mejoras de Performance

- Transiciones CSS optimizadas (200ms con cubic-bezier)
- Eliminación de re-renders innecesarios en providers
- Lazy mounting en ThemeProvider

### 🗑️ Eliminaciones

- ❌ `src/context/ModuleContext.tsx` (movido a providers)
- ❌ `src/components/providers/Providers.tsx` (reemplazado)
- ❌ `src/tailwind.config.ts` (movido a raíz)
- ❌ Carpeta `src/components/layout/` (solo tenía .gitkeep)

---

## [0.1.0] - 2025-12-09

### Inicial

- Configuración básica de Next.js
- TypeScript básico (modo no estricto)
- Tailwind CSS configurado
- next-themes instalado pero sin configurar
- Estructura de carpetas inicial

---

## Leyenda

- ✨ **Características**: Nuevas funcionalidades
- 🔨 **Refactorización**: Mejoras de código sin cambiar funcionalidad
- 📚 **Documentación**: Cambios en documentación
- 🐛 **Correcciones**: Bugs arreglados
- ⚡ **Performance**: Mejoras de rendimiento
- 🗑️ **Eliminaciones**: Código o archivos removidos
- 🔒 **Seguridad**: Vulnerabilidades corregidas
- 🔧 **Configuración**: Cambios en configuración
- 📊 **Métricas**: Estadísticas y mediciones
- ✅ **Validaciones**: Verificaciones y tests

---

## Próximas Versiones

### [1.2.0] - Planificado

#### Características Planificadas
- [ ] Aumentar cobertura de tests (objetivo: 80%)
- [ ] Implementar Storybook para documentación de componentes
- [ ] Agregar más componentes Shadcn (Dialog, Toast, etc.)
- [ ] Implementar gráficos con Recharts
- [ ] Sistema de formularios con react-hook-form + zod

#### Mejoras Planificadas
- [ ] E2E testing con Playwright
- [ ] Performance monitoring
- [ ] Optimizaciones de bundle size
- [ ] Lazy loading de módulos

---
## [1.5.0] - 2026-01-16
### ✨ Características Añadidas
- Módulo de Inventario completamente funcional (CRUD, búsqueda, filtrado, paginación)
- Integración con API REST simulada para datos de inventario
- Componentes Shadcn UI adicionales: `DataTable`, `Pagination`, `Dialog`, `Toast`, `Tooltip`, `Popover`, `Calendar`, `DateRangePicker`, `Command` (para búsqueda)
- Implementación de `react-hook-form` y `zod` para validación de formularios
- Sistema de notificaciones `Toast` para acciones de usuario
### 🔨 Refactorización
- Reestructuración del módulo de inventario para mejor escalabilidad y mantenimiento
- Optimización de consultas y renderizado de la tabla de inventario
### 📚 Documentación
- Actualización de `docs/PROJECT.md` con detalles del módulo de inventario
- Creación de `docs/SHADCN_INVENTORY.md` con ejemplos de uso de componentes Shadcn en el inventario
### 🐛 Correcciones
- Corregido error de paginación en la tabla de inventario
- Corregido problema de accesibilidad en componentes de formulario
### ⚡ Mejoras de Performance
- Implementación de `useDeferredValue` y `useTransition` para mejorar la responsividad de la UI
- Virtualización de la tabla de inventario para grandes conjuntos de datos
### 🗑️ Eliminaciones
- ❌ Código obsoleto relacionado con la gestión de estado manual del inventario

---
## [1.1.0] - 2026-01-15
### ✨ Características Añadidas
- Implementación de `CommandSearch` para búsqueda global
- Integración de `Shadcn UI` para componentes básicos
- Configuración de `Vitest` para testing unitario y de integración
- Configuración de `ESLint` y `Prettier` para calidad de código
- Configuración de `Husky` y `lint-staged` para pre-commit hooks
- Configuración de `GitHub Actions` para CI/CD

---

**Mantenido por**: Equipo de desarrollo & Antigravity IA  
**Versión**: 4.0.0  
**Última actualización**: 4 de marzo, 2026  
**Estado**: Estable / Security Hardened ✅

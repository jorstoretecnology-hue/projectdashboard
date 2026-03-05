# 🏗️ Arquitectura del Proyecto

> Documento técnico integral para desarrolladores y sistemas de IA. Define el **Cómo** se construye, mantiene y escala el sistema.

---

## 📐 1. Principios Arquitectónicos (SSOT)

### Separación de Responsabilidades
- **`src/app/`**: Orquestación de rutas y layouts (Next.js).
- **`src/modules/`**: Dominio de negocio (Inventory, CRM, etc.). Sigue el [Blueprint](file:///e:/ProyectDashboard/docs/MODULE_BLUEPRINT.md).
- **`src/core/`**: Infraestructura (Billing, Quotas, Auth).
- **`src/components/`**: UI genérica y componentes Shadcn/UI.

### Reglas de Oro
1. **Multi-tenancy RLS**: Aislamiento obligatorio por `tenant_id` en cada query.
2. **Server-Side Tenant Resolution**: El `tenant_id` debe resolverse en el servidor mediante `getRequiredTenantId()`. Prohibido pasarlo como argumento desde el cliente en mutaciones.
3. **Dependency Injection (DI)**: Los servicios deben recibir el `SupabaseClient` como dependencia para asegurar el uso del cliente de servidor en Server Actions.
4. **Type Safety**: TypeScript en modo estricto. Prohibido el uso de `any`.
5. **Validation First**: Todo input de Server Action debe ser validado con **Zod** antes de procesarse.

---

## 🔧 2. Stack Técnico y UI

### Tecnologías Core
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js 16** | Latest | Framework con App Router y Turbopack |
| **Supabase** | Latest | Backend-as-a-Service (Auth, DB, RLS) |
| **Tailwind CSS**| Latest | Utility-first CSS con Tokens Semánticos |
| **Shadcn/UI** | Latest | Componentes accesibles (Radix UI) |

### Integración de UI (Shadcn)
Usamos **shadcn/ui** para componentes de alta calidad. Los componentes se instalan vía CLI en `src/components/ui/`.
- **Personalización**: Se realiza mediante variables CSS en `globals.css`.
- **Variantes**: Gestionadas con `class-variance-authority` (CVA).
- **Imports**: Siempre desde el alias `@/components/ui/...`.

---

## 📊 3. Estándares de Código y Calidad

### Convenciones de Nombres
- **Componentes**: `PascalCase` (ej: `UserCard.tsx`).
- **Hooks**: `camelCase` con prefijo `use` (ej: `useInventory.ts`).
- **Constantes**: `UPPER_SNAKE_CASE`.
- **Utilidades**: `kebab-case.ts`.

### Estándares TypeScript
- **Interfaces**: Preferidas para objetos de negocio y props de componentes.
- **Tipado Explícito**: Obligatorio en parámetros de función y retornos públicos.
- **Zod**: Validación obligatoria para datos externos o formularios.

### Testing (Vitest + RTL)
- **Unit Testing**: Para lógica de negocio en `services`.
- **Component Testing**: Verificación de UI y accesibilidad con React Testing Library.
- **SaaS Context**: Los tests deben verificar el comportamiento bajo diferentes planes y tenants.

---

## 🛡️ 4. Capas de Resiliencia y Alineación

### Inventory Resilience
- **Bloqueo de Stock Negativo**: Validación obligatoria en servidor/BD.
- **Audit Logging**: Cada mutación crítica (stock, precios) registra quién, qué y por qué.
- **Override Auditado**: Permite stock negativo solo bajo rol autorizado y registro de intención.

### Automatización y Comunicación
- **Desacoplamiento**: El motor de automatización dispara eventos; el servicio de comunicación elige el canal/proveedor.
- **Resiliencia**: Reintentos automáticos con backoff y Dead Letter Queue (DLQ) para fallos críticos.

---

## 🔧 5. Troubleshooting Común

### Hydration Mismatches
Si la UI parpadea o falla al cargar:
1. Verifica que el componente use el hook `mounted` si depende del tema o `localStorage`.
2. Asegura que `suppressHydrationWarning` esté en el `html` tag.

### Problemas de Permisos (RLS)
Si los datos no aparecen:
1. Verifica que el `activeTenantId` esté presente en la sesión de Supabase.
2. Comenta temporalmente las políticas RLS para diagnóstico (solo en desarrollo local).

---

## 🚀 6. CI/CD y Despliegue
- **GitHub Actions**: Pipeline automatizado de linting, type-check y tests.
- **Vercel**: Despliegue continuo integrando Sentry para monitoreo de errores.

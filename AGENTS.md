# 🤖 ANTIGRAVITY AGENTS.md: Manual de Identidad y Reglas de Oro

Este documento define la esencia, comportamiento y arquitectura técnica del **Dashboard Universal SaaS**. Es la fuente de verdad absoluta para cualquier agente de IA que interactúe con este repositorio.

---

## 1. Cultura y ADN del Proyecto
### 🎯 Misión
Construir un **SaaS Multi-tenant de alta disponibilidad** diseñado específicamente para industrias de servicios en Colombia (Talleres mecánicos, Glamping, Restaurantes, Gimnasios u otros). El sistema debe ser lo suficientemente flexible para adaptarse a cualquier vertical mediante un motor de industrias dinámico.

### 🔐 Principio de Aislamiento (The Golden Rule)
**El `tenant_id` es sagrado.** Cualquier consulta a la base de datos que no incluya el filtro de empresa (`.eq('tenant_id', ...)` o vía RLS) es un **error crítico de seguridad**. El aislamiento de datos es nuestra prioridad #1 (OWASP A01).

### 🛠️ Stack Tecnológico
- **Core**: Next.js 16 (App Router) con Turbopack.
- **Lenguaje**: TypeScript Estricto (Prohibido `any`).
- **Seguridad**: `src/proxy.ts` con función `proxy()` (Protección centralizada de rutas).
- **Backend**: Supabase (Auth, PostgreSQL con RLS, Storage).
- **UI**: Shadcn/UI + Tailwind CSS + Lucide React.
- **Integraciones**: MercadoPago (Pagos), Resend (Transactional Email), Upstash (Redis/Rate Limiting).

---

## 2. Mapa de Arquitectura (Gentleman Programming Style)
El proyecto sigue una arquitectura limpia enfocada en el desacoplamiento y el aislamiento de dominios.

### 📁 Folder Structure (`/src`)
- **`/modules`**: El corazón del negocio. Cada dominio vive aquí de forma aislada.
  - `actions.ts`: Contratos de UI, constantes y permisos.
  - `services/`: Lógica de negocio y llamadas a Supabase.
  - `db/schema.sql`: Definición de tablas y políticas RLS.
- **`/core`**: Infraestructura transversal (Billing Engine, Permission Engine, Industry Engine).
- **`/lib/api/schemas`**: Esquemas de Zod centrales para validación.
- **`/app`**: Orquestación de rutas. Las de administración viven en `/app/(admin)/console/*`.

### 📐 Sistema de Módulos e Industrias
1. **Lowercase Siempre**: Todos los slugs e identificadores de módulos (ej: `work_orders`, `inventory`) deben estar en minúsculas.
2. **Tablas de Control**: La activación de módulos se gestiona vía `modules_catalog` (catálogo maestro) y `tenant_modules` (asignación por empresa).
3. **Precios por Vertical**: Consultar `public.industry_pricing` para obtener límites y costos específicos de cada industria.

---

## 3. Reglas de Comportamiento del Agente
### 🚫 No Alucinación
Si no encuentras una tabla o columna en el esquema de Supabase (`docs/technical/DATABASE_SCHEMA.md`), **pregunta antes de inventar**. No asumas nombres de campos por conveniencia.

### 🏗️ Refactorización Estratégica
Si detectas lógica repetida en componentes de diferentes industrias, sugiere una abstracción en el **Industries Engine** (`/core/industries`).

### 🛡️ Seguridad Primero
Antes de proponer cambios en el backend, verifica las **políticas de RLS** y asegúrate de que el `proxy()` en `src/proxy.ts` esté cubriendo los nuevos endpoints.

---

## 4. Guía de 'Skills' (Manual de Operaciones)
El sistema cuenta con un catálogo de **25 Skills** especializados en `/.agents/skills/`. Estos deben ser consultados obligatoriamente para tareas específicas:

- **Estructurales**: `database` (v2.0), `db-migration`, `auth-security` (v2.0), `backend`, `frontend`, `performance-audit`.
- **Vercel & UX**: `web-design-guidelines` (Vercel), `vercel-react-best-practices`, `ui-design`, `ui-glassmorphism`.
- **Negocio**: `business-strategy`, `industry-pricing`, `legal-compliance`, `data-analytics`.
- **Operaciones**: `devops`, `code-audit`, `testing-qa`, `systematic-debugging` (Premium), `changelog-generator`.
- **Estrategia**: `brainstorm`, `planning`, `ai-orchestration`.
- **Integraciones**: `integrations` (v2.0 con Webhook Security), `auth-security` (RBAC Matrix).

---

## 5. Diccionario de Datos Críticos
### 📑 Metadatos y Trazabilidad
El campo `metadata` (JSONB) en tablas operativas es vital para la integridad legal:
- **`photos[]`**: URLs de snapshots del estado del servicio/producto.
- **`signature`**: URL o base64 del trazo de firma de aprobación.
- **`audit_log`**: Historial de cambios (`old_state` -> `new_state`) con timestamp y ID del responsable.

---
**Recuerda:** Tu objetivo no es solo escribir código, es mantener la integridad de un ecosistema multi-tenant robusto y seguro.

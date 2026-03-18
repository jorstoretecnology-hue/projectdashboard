# 🧭 CONTEXTO DEL PROYECTO - Dashboard Universal SaaS

> **Documento de Contexto Rápido** para que cualquier IA o desarrollador entienda el proyecto en 5 minutos.
>
> **Última actualización:** 15 de marzo de 2026  
> **Versión:** 4.6.0 (Hardened & Modular)  
> **Estado:** ✅ Producción Ready - Multi-tenant SaaS Core

---

## 🎯 ¿QUÉ ES ESTE PROYECTO? (Elevator Pitch)

Es una **plataforma SaaS multi-tenant** de gestión empresarial adaptable a diferentes industrias. Un solo código base sirve para:
- 🏪 Tiendas/retail
- 🔧 Talleres mecánicos
- 🏋️ Gimnasios
- 🍽️ Restaurantes
- 🏨 Glamping/hoteles
- 🍺 Discotecas
- 🔩 Ferreterías

Cada cliente (tenant) tiene su propio branding, módulos activados según su industria, y datos completamente aislados.

---

## 🏗️ ARQUITECTURA EN 30 SEGUNDOS

```
┌────────────────────────────────────────────────────┐
│  FRONTEND: Next.js 16 (App Router + Turbopack)    │
│  - Server Components para fetch de datos          │
│  - Client Components para interacción             │
│  - TailwindCSS + Shadcn/UI para diseño            │
└────────────────────────────────────────────────────┘
                        ↕
┌────────────────────────────────────────────────────┐
│  BACKEND: Supabase (PostgreSQL + Auth + RLS)      │
│  - Auth: Email/Password + Google OAuth            │
│  - DB: PostgreSQL con Row Level Security          │
│  - Storage: Archivos privados con Signed URLs     │
└────────────────────────────────────────────────────┘
                        ↕
┌────────────────────────────────────────────────────┐
│  SERVICIOS EXTERNOS                                │
│  - Resend: Emails transaccionales                 │
│  - Upstash Redis: Rate limiting (60 req/min)      │
│  - Sentry: Monitoreo de errores                   │
│  - MercadoPago: Pagos (pendiente integración)     │
└────────────────────────────────────────────────────┘
```

---

## 📁 ESTRUCTURA DE CARPETAS CLAVE

```
src/
├── app/                    # Rutas (App Router)
│   ├── (admin)/console/   # Panel SuperAdmin (ofuscado)
│   ├── (app)/             # Dashboard por tenant
│   ├── (public)/          # Rutas públicas
│   ├── api/               # Endpoints REST
│   ├── auth/              # Login, registro, verificación OTP
│   ├── onboarding/        # Flujo 3 pasos: Identidad → Industria → Plan
│   └── post-auth/         # Auto-onboarding de invitados
│
├── modules/                # 🎯 DOMINIO DE NEGOCIO (¡Importante!)
│   ├── admin/             # Métricas SaaS
│   ├── auth/              # Lógica autenticación
│   ├── customers/         # Clientes
│   ├── dashboard/         # Dashboard principal
│   ├── inventory/         # Inventario
│   ├── sales/             # Ventas y POS
│   ├── purchases/         # Compras
│   ├── services/          # Órdenes de servicio (talleres)
│   ├── team/              # Gestión de equipos
│   └── tenants/           # Configuración de tenants
│
├── core/                   # Infraestructura crítica
│   ├── billing/           # Facturación
│   ├── modules/           # Registry de módulos
│   ├── quotas/            # Sistema de cuotas por plan
│   └── security/          # Auditoría y seguridad
│
├── lib/                    # Utilidades
│   ├── api/               # Clientes de API
│   ├── auth/              # Funciones de autenticación
│   ├── supabase/          # Clientes Supabase
│   ├── schemas/           # Schemas Zod centralizados
│   ├── pricing.ts         # Cálculo de precios dinámicos
│   └── logger.ts          # Logger centralizado
│
├── providers/              # Context Providers
│   ├── AuthContext.tsx    # Estado de autenticación
│   ├── TenantContext.tsx  # Tenant actual
│   ├── ModuleContext.tsx  # Módulos activos
│   └── ThemeProvider.tsx  # Tema claro/oscuro
│
└── components/
    ├── ui/                # Shadcn/UI (no tocar)
    └── layout/            # Navbar, Sidebar, TenantSelector
```

---

## 🔑 CONCEPTOS FUNDAMENTALES

### 1. Multi-tenancy con RLS
```typescript
// ✅ CORRECTO: RLS siempre aplicado
const { data } = await supabase
  .from('customers')
  .select('id, name, email')
  .eq('tenant_id', await getRequiredTenantId())

// ❌ PROHIBIDO: Query sin filtro de tenant
const { data } = await supabase
  .from('customers')
  .select('*')  // ❌ Sin tenant_id
```

### 2. Server-Side Tenant Resolution
```typescript
// ✅ CORRECTO: Tenant resuelto en servidor
async function createCustomer(data: CreateCustomerDTO) {
  const tenantId = await getRequiredTenantId() // ← Server-side
  return db.insert({ ...data, tenant_id: tenantId })
}

// ❌ PROHIBIDO: Tenant pasado desde cliente
async function createCustomer(data: { tenant_id: string }) {
  return db.insert(data) // ← tenant_id viene del cliente
}
```

### 3. Validación Zod en Inputs
```typescript
// ✅ CORRECTO: Validar con Zod antes de procesar
const createCustomerSchema = z.object({
  first_name: z.string().min(2),
  email: z.string().email(),
})

async function createCustomerAction(rawData: unknown) {
  const data = createCustomerSchema.parse(rawData)
  // ... procesar
}
```

### 4. Activación Automática de Módulos
```
Registro → elige industria
   ↓
Onboarding crea tenant (industry_type guardado)
   ↓
Trigger SQL activa módulos según plan + industria (automático)
   ↓
Free: dashboard + inventory + sales
Starter: 9 módulos universales
Professional/Enterprise: todos los módulos compatibles
```

---

## 📊 ESTADO ACTUAL (Marzo 2026)

### ✅ COMPLETADO
- [x] Next.js 16 con App Router y Turbopack
- [x] Autenticación Supabase (Email + Google OAuth)
- [x] Onboarding progresivo de 3 pasos
- [x] Sistema de invitaciones por email con auto-onboarding
- [x] Multi-tenancy con RLS completo
- [x] Branding dinámico por tenant (CSS variables)
- [x] SuperAdmin Dashboard centralizado
- [x] Módulo de inventario adaptable por industria
- [x] Motor de 7 industrias configuradas
- [x] Sentry + Resend + Upstash
- [x] Rate limiting (60 req/min)
- [x] Sistema de pricing vertical por industria
- [x] Activación automática de módulos (trigger SQL)
- [x] Auditoría de acciones (audit logs)
- [x] CI/CD con GitHub Actions
- [x] Testing con Vitest (~60% cobertura)

### 🚧 EN PROGRESO / PRÓXIMAMENTE
- [ ] **Pagos con MercadoPago** (P0 - Fase 11)
- [ ] Internacionalización (i18n)
- [ ] Facturación electrónica Colombia
- [ ] Módulo de reservas (glamping/restaurantes)
- [ ] Módulo de membresías (gym)

---

## 🎯 PRÓXIMOS PASOS CONCRETOS

### Prioridad P0 (Esta semana)

**1. Ejecutar migraciones SQL en Supabase**
```sql
-- Abrir: https://app.supabase.com/project/_sql
-- Ejecutar en orden:
-- 1. supabase/migrations/20260314000000_activate_modules_for_tenants.sql
-- 2. supabase/migrations/20260314000001_get_tenant_price.sql
```

**2. Integración con MercadoPago**
- Conectar RPCs de pricing con pasarela de pagos
- Activar paso de facturación en onboarding
- Ver: `src/lib/pricing.ts` y `docs/plan_modulos_planes.md`

**3. Limpieza de código**
- Eliminar 64 tipos `any` restantes
- Optimizar queries con `select('*')` (21 ocurrencias)
- Reemplazar console.log con logger.ts (42 ocurrencias)

---

## 📚 DOCUMENTACIÓN ESENCIAL

| Documento | Cuándo leer | Ubicación |
|-----------|-------------|-----------|
| **PROGRESS_TRACKER.md** | **PRIMERO** - Estado actual y tareas | `docs/` |
| **MODULE_BLUEPRINT.md** | Al desarrollar features nuevas | `docs/` |
| **DATABASE_SCHEMA.md** | Al escribir queries SQL | `docs/` |
| **SECURITY_CHECKLIST.md** | Al tocar auth/permisos | `docs/` |
| **PROMPT_MAESTRO_COORDINACION.md** | **OBLIGATORIO** - Protocolo de agentes | `docs/` |
| **SECURITY_QUICK_REFERENCE.md** | **PRIMERO** - Referencia rápida de ejecución | `docs/` |
| **SECURITY_PLAYBOOK_SaaS.md** | Marco integral de seguridad y cumplimiento | `docs/` |
| **ARCHITECTURE_SUMMARY.md** | Como referencia completa | raíz |
| **IMPLEMENTATION_STEPS.md** | Para ejecutar migraciones | raíz |

---

## 🔧 COMANDOS PRINCIPALES

```bash
# Desarrollo
npm run dev              # Servidor con Turbopack
npm run build            # Build de producción
npm run start            # Servidor de producción

# Calidad de Código
npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run lint:fix         # Auto-fix ESLint
npm run format           # Prettier write
npm run format:check     # Prettier check

# Testing
npm test                 # Vitest run
npm run test:watch       # Vitest watch
npm run test:coverage    # Vitest con coverage

# Verificación Completa
npm run check            # type-check + lint + test (paralelo)

# Auditoría
npx ts-prune             # Detectar código muerto TypeScript
npx knip                 # Detectar imports no usados
```

---

## 🔐 REGLAS INMUTABLES (VIOLAR = CRITICAL BUG)

1. **RLS siempre aplicado** - Toda query debe filtrar por `tenant_id`
2. **Tenant resuelto en servidor** - Nunca pasar `tenant_id` desde el cliente
3. **TypeScript estricto** - Prohibido `any` (usar `unknown` + type guards)
4. **Validación Zod en inputs** - Siempre validar antes de procesar
5. **Dependency Injection** - Servicios reciben cliente Supabase inyectado
6. **No console.log en producción** - Usar `logger.ts`
7. **Campos explícitos en queries** - Prohibido `select('*')`

---

## 📊 MÉTRICAS DE CÓDIGO

| Métrica | Valor |
|---------|-------|
| Líneas totales | ~25,000 |
| Archivos TypeScript | ~220 |
| Componentes React | ~110 |
| Endpoints API | ~15 |
| Tablas DB | ~20 |
| Cobertura de tests | ~60% |
| Tipos `any` restantes | 64 |
| Queries `select('*')` | 21 |
| console.log en producción | 42 |

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Hydration Mismatch
```tsx
// ✅ Solución: Usar mounted flag
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

if (!mounted) return <Skeleton />
return <ComponentThatUsesTheme />
```

### RLS Policy Bloquea Datos
```sql
-- Debug: Verificar políticas activas
SELECT * FROM pg_policies WHERE tablename = 'customers';

-- Temporal: Desactivar RLS (solo dev local)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Re-activar
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
```

### Stuck on Loading (Onboarding)
```typescript
// Fix: Usar revalidatePath y reset de estado en server action
// Ver: src/app/onboarding/actions.ts
```

### Error: "function activate_modules_for_tenant does not exist"
```sql
-- Solución: Ejecutar migración
-- supabase/migrations/20260314000000_activate_modules_for_tenants.sql
```

---

## 📞 CONTACTO Y SOPORTE

### Canales de Comunicación
- **GitHub Issues:** Bugs y feature requests
- **Slack Antigravity:** Canal #dashboard-universal
- **Email:** soporte@antigravity.com

### Horarios de Soporte
- **Lunes a Viernes:** 9:00 AM - 6:00 PM (Bogotá)
- **Sábados:** 9:00 AM - 1:00 PM (Bogotá)
- **Emergencias:** 24/7 vía Slack

---

## 🚀 FLUJO DE TRABAJO RECOMENDADO PARA IAs

```
1. Leer este documento (CONTEXTO_DEL_PROYECTO.md)
   ↓
2. Leer PROGRESS_TRACKER.md para estado actual
   ↓
3. Identificar tarea específica
   ↓
4. Consultar documentación específica:
   - ¿Nuevo módulo? → MODULE_BLUEPRINT.md
   - ¿Query SQL? → DATABASE_SCHEMA.md
   - ¿Auth/permisos? → SECURITY_CHECKLIST.md
   - ¿API endpoint? → API_SPECIFICATION.md
   ↓
5. Implementar siguiendo patrones establecidos
   ↓
6. Ejecutar: npm run check
   ↓
7. Verificar que no hay errores
```

---

## 📈 PRÓXIMOS HITOS

| Hito | Fecha Estimada | Estado |
|------|----------------|--------|
| v4.7.0 - Pagos MercadoPago | Marzo 2026 | 🚧 En desarrollo |
| v4.8.0 - Módulo de Reservas | Abril 2026 | 📋 Planificado |
| v4.9.0 - Facturación Electrónica | Mayo 2026 | 📋 Planificado |
| v5.0.0 - Multi-sede + i18n | Junio 2026 | 🎯 En planificación |

---

**Fin del Documento de Contexto**

*¿Necesitas más detalles? Consulta la documentación específica en `docs/` o `ARCHITECTURE_SUMMARY.md` en la raíz.*

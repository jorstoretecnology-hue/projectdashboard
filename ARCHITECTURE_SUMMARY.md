# 🤖 ANTIGRAVITY AI CONTEXT HUB

> **Documento Maestro para Asistentes de IA** - Dashboard Universal SaaS
> 
> **Última actualización:** 15 de marzo de 2026  
> **Versión del Proyecto:** 4.6.0  
> **Estado:** 🛡️ Hardened & Modular (Audit 8.5/10)

---

## 🎯 PROPÓSITO DE ESTE DOCUMENTO

Este es el **único punto de verdad** que cualquier IA de Antigravity debe leer al iniciar una sesión de trabajo. Contiene:
- Contexto arquitectónico esencial
- Estado actual del proyecto
- Tareas prioritarias
- Reglas inmutables
- Patrones de código establecidos

---

## 📚 JERARQUÍA DE DOCUMENTACIÓN

### Nivel 1 — Lectura Obligatoria (SIEMPRE empezar aquí)
| Documento | Propósito | Cuándo leer |
|-----------|-----------|-------------|
| **`./docs/PROGRESS_TRACKER.md`** | Estado actual, qué se hizo, qué sigue | **PRIMERO** en cada sesión |
| **`./docs/MODULE_BLUEPRINT.md`** | Patrón para crear módulos | Al desarrollar features nuevas |
| **`./ARCHITECTURE_SUMMARY.md`** (este archivo) | Arquitectura y contexto | Siempre como referencia |

### Nivel 2 — Consulta Específica
| Documento | Propósito | Cuándo leer |
|-----------|-----------|-------------|
| `./docs/SECURITY_CHECKLIST.md` | Seguridad y RLS | Al tocar auth/permisos |
| `./docs/SECURITY_PIPELINE_README.md` | Auditoría CI/CD con JSON | Al ejecutar validaciones |
| `./docs/DATABASE_SCHEMA.md` | Esquema de DB | Al escribir queries |
| `./docs/API_SPECIFICATION.md` | Endpoints API | Al crear/consumir APIs |
| `./docs/BUSINESS_FLOWS.md` | Flujos de negocio | Al implementar lógica |
| `./docs/PERMISSIONS_MATRIX.md` | Matriz de permisos | Al validar acceso |

### Nivel 3 — Estrategia y Largo Plazo
| Documento | Propósito | Cuándo leer |
|-----------|-----------|-------------|
| `./docs/PRODUCT_STRATEGY.md` | Visión del producto | Al planear features |
| `./docs/ROADMAP_12M.md` | Roadmap 12 meses | Al priorizar |
| `./docs/IMPLEMENTATION_ROADMAP.md` | Plan de implementación | Al ejecutar fases |

---

## 🏗️ ARQUITECTURA TÉCNICA (RESUMEN EJECUTIVO)

### Stack Tecnológico
```
Next.js 16 (App Router + Turbopack)
├── TypeScript 5.3 (estricto, prohibido `any`)
├── Supabase (Auth + DB + RLS + Storage)
├── Tailwind CSS + Shadcn/UI
├── Zod (validación de schemas)
├── Vitest + React Testing Library (testing)
├── Upstash Redis (Rate Limiting)
└── Sentry + Resend (monitoreo e infraestructura)
```

### Estructura de Código
```
src/
├── app/                    # App Router (orquestación)
│   ├── (admin)/           # Rutas SuperAdmin
│   ├── (app)/             # Rutas principales de tenant
│   ├── (public)/          # Rutas públicas
│   ├── api/               # Endpoints REST
│   └── auth/              # Callbacks de autenticación
│
├── components/             # Componentes React
│   ├── ui/                # Shadcn/UI (no tocar)
│   ├── layout/            # Navbar, Sidebar, etc.
│   └── [modulo]/          # Componentes específicos
│
├── config/                 # Configuraciones globales
│   ├── industries/        # Motor de industrias
│   ├── modules.ts         # Configuración de módulos
│   ├── permissions.ts     # Matriz de permisos
│   └── tenants.ts         # Configuración de tenants
│
├── core/                   # Infraestructura crítica
│   ├── billing/           # Motor de facturación
│   ├── modules/           # Registry de módulos
│   ├── quotas/            # Sistema de cuotas
│   └── security/          # Auditoría y seguridad
│
├── hooks/                  # Custom hooks de React
├── lib/                    # Utilidades y servicios
│   ├── api/               # Clientes de API
│   ├── auth/              # Funciones de autenticación
│   ├── supabase/          # Clientes Supabase
│   ├── schemas/           # Schemas Zod centralizados
│   └── validations/       # Validaciones reutilizables
│
├── modules/                # DOMINIO DE NEGOCIO (¡Importante!)
│   ├── admin/
│   ├── auth/
│   ├── customers/
│   ├── dashboard/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── services/
│   └── team/
│
├── providers/              # Context Providers
│   ├── AuthContext.tsx    # Autenticación
│   ├── TenantContext.tsx  # Tenant actual
│   ├── ModuleContext.tsx  # Módulos activos
│   └── ThemeProvider.tsx  # Temas
│
└── types/                  # Tipos TypeScript globales
```

---

## ⚡ REGLAS INMUTABLES (VIOLAR = CRITICAL BUG)

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
  .select('*')  // ❌ Sin tenant_id, sin campos explícitos
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

### 3. Type Safety Estricto
```typescript
// ✅ CORRECTO: Tipos explícitos
interface Customer {
  id: string
  name: string
  email: string
}

// ❌ PROHIBIDO: any (64 ocurrencias para eliminar)
function createCustomer(data: any) {
  return db.insert(data)
}
```

### 4. Validación Zod en Inputs
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

// ❌ PROHIBIDO: Procesar sin validar
async function createCustomerAction(data: any) {
  // ... procesar directamente
}
```

### 5. Dependency Injection para Supabase
```typescript
// ✅ CORRECTO: Cliente inyectado
class CustomerService {
  constructor(private supabase: SupabaseClient) {}

  async list() {
    return this.supabase.from('customers').select('id, name')
  }
}

// ❌ PROHIBIDO: Cliente global en servicios
class CustomerService {
  async list() {
    const supabase = createClient() // ← No hacer en servicios
  }
}
```

### 6. Security Pipeline con Validación JSON
```bash
# ✅ CORRECTO: Ejecutar auditoría antes de deploy
npm run security:audit    # Genera reporte MD + JSON
npm run security:validate # Valida umbrales críticos

# ❌ PROHIBIDO: Deploy sin validación
# - El pipeline falla si hay: type errors, console.log, select(*), 
#   vulnerabilidades críticas/altas, tests fallidos, missing RLS
```

---

## 🎯 ESTADO ACTUAL DEL PROYECTO

### ✅ Completado (Versión 4.0.0)
- [x] Next.js 16 con App Router y Turbopack
- [x] Autenticación Supabase (Email + Google OAuth)
- [x] Onboarding progresivo (3 pasos: Identidad → Industria → Plan)
- [x] Sistema de invitaciones por email con auto-onboarding
- [x] Multi-tenancy con RLS completo
- [x] Branding dinámico por tenant (CSS variables)
- [x] SuperAdmin Dashboard centralizado
- [x] Módulo de inventario adaptable por industria
- [x] Motor de industrias (7 verticales: taller, restaurante, gym, etc.)
- [x] Sentry (monitoreo de errores)
- [x] Resend (emails transaccionales)
- [x] Rate limiting con Upstash Redis
- [x] Auditoría de acciones (audit logs)
- [x] CI/CD con GitHub Actions
- [x] Testing con Vitest

### 🚧 En Progreso / Próximamente
- [ ] Pagos con MercadoPago/Stripe (adapter pattern listo)
- [ ] Internacionalización (i18n)
- [ ] Integración fiscal (facturación electrónica Colombia)
- [ ] Módulo de reservas (glamping/restaurantes)
- [ ] Módulo de membresías (gym)

### 📊 Métricas de Código
| Métrica | Valor |
|---------|-------|
| Líneas totales | ~25,000 |
| Archivos TypeScript | ~220 |
| Componentes React | ~110 |
| Endpoints API | ~15 |
| Tablas DB | ~20 |
| Cobertura de tests | ~60% |

---

## 🔥 PRIORIDADES INMEDIATAS (AUDITORÍA MARZO 2026)

### Crítico (Semana 1)
1. **Eliminar archivos de debug/test de producción**
   - `src/app/api/debug-role/route.ts` ← ELIMINAR
   - `src/app/api/test-auth/route.ts` ← ELIMINAR
   - `src/app/test-public/page.tsx` ← ELIMINAR

2. **Reemplazar console.log con logger service**
   - 42 console.log encontrados en producción
   - Prioridad: auth, onboarding, API routes
   - Usar `src/lib/logger.ts`

3. **Unificar schemas duplicados de Customer**
   - `src/lib/api/schemas/customers.ts` (first_name, tax_id)
   - `src/modules/customers/types.ts` (firstName, companyName)
   - **Acción:** Fusionar en uno solo con naming consistente

4. **Eliminar tipos `any` críticos**
   - 64 ocurrencias de `any` en el código
   - Prioridad: `DashboardClient.tsx`, `TenantGuard.tsx`, `useUserManagement.ts`
   - Usar `unknown` + type guards

### Alto Impacto (Semana 2-3)
5. **Centralizar tipos en `src/types/index.ts`**
   - Mover tipos duplicados de `config/tenants.ts`, `config/industries/types.ts`
   - Eliminar imports circulares

6. **Optimizar queries de Supabase**
   - 21 ocurrencias de `select('*')`
   - Reemplazar con campos explícitos
   - Agregar `.limit()` a queries sin paginación

7. **Refactorizar hooks de fetch**
   - `useCustomers`, `useSales`, `useEvents` hacen fetch en useEffect
   - Mover a Server Components o usar React Query/SWR

8. **Dividir archivos grandes (>400 líneas)**
   - `onboarding/page.tsx` → 3 componentes de paso
   - `auth/verify/page.tsx` → componentes de estado
   - `DashboardClient.tsx` → sub-componentes

---

## 📝 PATRONES DE CÓDIGO ESTABLECIDOS

### Patrón: Server Action con Validación
```typescript
// src/modules/customers/actions.ts
'use server'

import { z } from 'zod'
import { createCustomerSchema } from '@/lib/schemas/customers'
import { customerService } from './services/customer.service'
import { getRequiredTenantId } from '@/lib/supabase/auth'
import { auditLogService } from '@/core/security/audit.service'

export async function createCustomerAction(rawData: unknown) {
  // 1. Validar input con Zod
  const data = createCustomerSchema.parse(rawData)
  
  // 2. Resolver tenant en servidor
  const tenantId = await getRequiredTenantId()
  
  // 3. Ejecutar servicio
  const customer = await customerService.create({
    ...data,
    tenant_id: tenantId
  })
  
  // 4. Auditar acción
  await auditLogService.log({
    action: 'CREATE',
    entityType: 'customer',
    entityId: customer.id,
    userId: (await getUser()).id
  })
  
  return customer
}
```

### Patrón: Server Component con Fetch
```typescript
// src/app/(app)/customers/page.tsx
import { createClient } from '@/lib/supabase/server'
import { CustomersClient } from './CustomersClient'

export default async function CustomersPage() {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()
  
  // Fetch directo en servidor (NO useEffect)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, company_name')
    .eq('tenant_id', tenantId)
    .limit(100)
  
  return <CustomersClient 
    initialCustomers={customers} 
    tenantId={tenantId}
  />
}
```

### Patrón: Service con Repository
```typescript
// src/modules/customers/services/customer.service.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { CreateCustomerDTO, Customer } from '@/types'

export class CustomerService {
  constructor(private supabase: SupabaseClient) {}
  
  async list(tenantId: string, limit = 100) {
    const { data, error } = await this.supabase
      .from('customers')
      .select('id, first_name, last_name, email, company_name, status')
      .eq('tenant_id', tenantId)
      .limit(limit)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data.map(this.mapToDomain)
  }
  
  async create(data: CreateCustomerDTO) {
    const { data: customer, error } = await this.supabase
      .from('customers')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return this.mapToDomain(customer)
  }
  
  private mapToDomain(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      firstName: dbCustomer.first_name,
      lastName: dbCustomer.last_name,
      email: dbCustomer.email,
      // ... mapeo explícito
    }
  }
}

export const customerService = new CustomerService(supabase)
```

### Patrón: Componente Cliente con Formulario
```typescript
// src/components/customers/CustomerDialog.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCustomerSchema } from '@/lib/schemas/customers'
import { createCustomerAction } from '@/modules/customers/actions'
import { toast } from 'sonner'

export function CustomerDialog({ open, onOpenChange }) {
  const form = useForm({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
    }
  })
  
  const onSubmit = async (data) => {
    try {
      await createCustomerAction(data)
      toast.success('Cliente creado')
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error('Error al crear cliente')
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* campos */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🛠️ COMANDOS DE DESARROLLO

### Scripts Principales
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
```

### Herramientas de Auditoría
```bash
# Detectar código muerto
npx ts-prune             # TypeScript no usado
npx knip                 # Imports y exports no usados

# Análisis de dependencias
npm audit                # Vulnerabilidades
npm outdated             # Dependencias desactualizadas
```

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

// Fix: Forzar logout local si el JWT es inválido
if (error.status === 403 || error.message.includes('sub claim')) {
  await supabase.auth.signOut({ scope: 'local' })
  window.location.reload()
}
```

### Stuck on Loading (Onboarding)
```typescript
// Fix: Usar revalidatePath y reset de estado en server action
// Ver e:\ProyectDashboard\src\app\onboarding\actions.ts
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

## 📈 PRÓXIMOS HITOS

| Hito | Fecha Estimada | Estado |
|------|----------------|--------|
| v4.1.0 - Pagos MercadoPago | Marzo 2026 | 🚧 En desarrollo |
| v4.2.0 - Módulo de Reservas | Abril 2026 | 📋 Planificado |
| v4.3.0 - Facturación Electrónica | Mayo 2026 | 📋 Planificado |
| v5.0.0 - Multi-sede + i18n | Junio 2026 | 🎯 En planificación |

---

**Fin del Documento Maestro**

*¿Necesitas más detalles? Consulta la documentación específica en `./docs/`*

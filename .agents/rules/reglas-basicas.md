---
trigger: always_on
glob: "**/*.{ts,tsx,js,jsx,sql,md}"
description: Reglas básicas de desarrollo seguro para Dashboard Universal SaaS
---

# 📋 Reglas Básicas de Desarrollo - Dashboard Universal SaaS

> **Versión**: 5.0.0
> **Última actualización**: 22 de marzo de 2026
> **Estado**: ✅ Obligatorio para todo el equipo de desarrollo (humano e IA)

---

## 🎯 Propósito

Este documento establece las reglas **OBLIGATORIAS** que deben seguirse en cada línea de código escrita para este proyecto SaaS multi-tenant. La violación de estas reglas resulta en **CRITICAL BUG** y debe ser bloqueada antes de llegar a producción.

---

## 📚 JERARQUÍA DE DOCUMENTACIÓN

### Nivel 1 — Lectura Obligatoria (SIEMPRE empezar aquí)
| Documento | Propósito | Cuándo leer |
|-----------|-----------|-------------|
| **`docs/PROGRESS_TRACKER.md`** | Estado actual, qué se hizo, qué sigue | **PRIMERO** en cada sesión |
| **`docs/technical/MODULE_BLUEPRINT.md`** | Patrón para crear módulos | Al desarrollar features nuevas |
| **`ARCHITECTURE_SUMMARY.md`** | Arquitectura y contexto | Siempre como referencia |

### Nivel 2 — Consulta Específica
| Documento | Propósito | Cuándo leer |
|-----------|-----------|-------------|
| `docs/security/SECURITY_CHECKLIST.md` | Seguridad y RLS | Al tocar auth/permisos |
| `docs/security/SECURITY_QUICK_REFERENCE.md` | Referencia rápida de ejecución | En cada commit |
| `docs/technical/DATABASE_SCHEMA.md` | Esquema de DB | Al escribir queries |
| `docs/technical/API_SPECIFICATION.md` | Endpoints API | Al crear/consumir APIs |
| `docs/technical/PERMISSIONS_MATRIX.md` | Matriz de permisos | Al validar acceso |

---

## 🔐 REGLAS DE SEGURIDAD (CRÍTICAS)

### Regla 1.1: Row Level Security (RLS) Obligatorio
**Severidad**: 🔴 CRÍTICA | **Estándar**: ISO 27001, OWASP A01

```typescript
// ✅ CORRECTO - RLS aplicado
const { data } = await supabase
  .from('customers')
  .select('id, name, email')
  .eq('tenant_id', await getRequiredTenantId())

// ❌ PROHIBIDO - Sin filtro de tenant (BLOQUEAR)
const { data } = await supabase
  .from('customers')
  .select('*')
```

**Validación automática**:
- Todas las queries deben incluir `.eq('tenant_id', ...)`
- Prohibido `bypassRLS(true)` sin comentario explícito
- Todas las tablas deben tener `ENABLE ROW LEVEL SECURITY`

---

### Regla 1.2: Prohibido `select('*')`
**Severidad**: 🔴 CRÍTICA | **Estándar**: OWASP A01, Mínimo Privilegio

```typescript
// ✅ CORRECTO - Campos explícitos
.select('id, first_name, last_name, email, tenant_id')

// ❌ PROHIBIDO - Select star (BLOQUEAR)
.select('*')
```

**Razón**:
- Previene leakage de datos sensibles
- Mejora performance de queries
- Cumple con principio de mínimo privilegio

---

### Regla 1.3: Validación de Inputs con Zod
**Severidad**: 🔴 CRÍTICA | **Estándar**: OWASP A05, ISO 27001 A.14.2.5

```typescript
// ✅ CORRECTO - Schema definido
const createCustomerSchema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
})

async function createCustomerAction(rawData: unknown) {
  const data = createCustomerSchema.parse(rawData)
  // ... procesar
}

// ❌ PROHIBIDO - Sin validación (BLOQUEAR)
async function createCustomerAction(data: any) {
  // ... procesar directamente
}
```

---

### Regla 1.4: TypeScript Estricto - Prohibido `any`
**Severidad**: 🟠 ALTA | **Estándar**: TypeScript Best Practices

```typescript
// ✅ CORRECTO - Tipos explícitos
interface Customer {
  id: string
  tenant_id: string
  first_name: string
  email: string
}

function createCustomer(data: Customer): Promise<Customer> {
  return db.insert(data)
}

// ✅ CORRECTO - unknown con type guard
function processInput(input: unknown) {
  if (typeof input === 'object' && input !== null && 'id' in input) {
    // Type narrowing
  }
}

// ❌ PROHIBIDO - any (SUGERIR corrección)
const data: any = await fetchData()
```

**Meta**: Eliminar 64 ocurrencias restantes de `any`

---

### Regla 1.5: Server-Side Tenant Resolution
**Severidad**: 🔴 CRÍTICA | **Estándar**: Multi-tenant Isolation

```typescript
// ✅ CORRECTO - Tenant resuelto en servidor
async function createCustomer(data: CreateCustomerDTO) {
  const tenantId = await getRequiredTenantId() // ← Server-side
  return db.insert({ ...data, tenant_id: tenantId })
}

// ❌ PROHIBIDO - Tenant pasado desde cliente (BLOQUEAR)
async function createCustomer(data: { tenant_id: string }) {
  return db.insert(data) // ← tenant_id viene del cliente
}
```

---

### Regla 1.6: Gestión Segura de Secretos
**Severidad**: 🔴 CRÍTICA | **Estándar**: ISO 27001 A.10.1.1

```typescript
// ✅ CORRECTO - Variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const apiKey = process.env.STRIPE_SECRET_KEY!

// ❌ PROHIBIDO - Hardcodear secretos (BLOQUEAR)
const supabaseUrl = 'https://abc123.supabase.co'
const apiKey = 'sk_live_123456'
```

**Validación**:
- `.env` debe estar en `.gitignore`
- Usar `.env.example` como plantilla
- Secrets en producción: AWS Secrets Manager / Vercel Env

---

### Regla 1.7: Logging Seguro
**Severidad**: 🟠 ALTA | **Estándar**: OWASP A09, ISO 27001 A.12.4.1

```typescript
// ✅ CORRECTO - Logger centralizado
import { logger } from '@/lib/logger'
logger.info('Customer created', { customerId: customer.id })

// ✅ CORRECTO - Sentry para errores
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)

// ❌ PROHIBIDO - console.log en producción (SUGERIR reemplazo)
console.log('User data:', user)
console.log('Password:', password) // 🔴 NUNCA loguear PII
```

**Reglas de sanitización**:
- NUNCA loguear: passwords, tokens, PII completo
- Emails: usar hash para debugging (`user***@gmail.com`)
- Tokens: mostrar solo últimos 4 caracteres

---

### Regla 1.8: Autenticación y Autorización
**Severidad**: 🔴 CRÍTICA | **Estándar**: OWASP A01, A02

```typescript
// ✅ CORRECTO - Verificar auth
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ✅ CORRECTO - Verificar rol para rutas admin
if (user.app_metadata?.app_role !== 'SUPER_ADMIN') {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

// ❌ PROHIBIDO - Sin verificar auth (BLOQUEAR)
export async function GET() {
  const data = await supabase.from('users').select()
  return NextResponse.json(data)
}
```

---

### Regla 1.9: Dependency Injection para Supabase
**Severidad**: 🟠 ALTA | **Estándar**: Clean Architecture

```typescript
// ✅ CORRECTO - Cliente inyectado
class CustomerService {
  constructor(private supabase: SupabaseClient) {}

  async list(tenantId: string) {
    return this.supabase
      .from('customers')
      .select('id, name')
      .eq('tenant_id', tenantId)
  }
}

// ❌ PROHIBIDO - Cliente global en servicios
class CustomerService {
  async list() {
    const supabase = createClient() // ← No hacer en servicios
  }
}
```

---

### Regla 1.10: Manejo de Errores
**Severidad**: 🟠 ALTA | **Estándar**: OWASP A09

```typescript
// ✅ CORRECTO - Error handling completo
try {
  await customerService.create(data)
  toast.success('Cliente creado')
} catch (error) {
  logger.error('Failed to create customer', { error, data })
  toast.error('Error al crear cliente')
  Sentry.captureException(error)
}

// ❌ PROHIBIDO - Error handling vacío (SUGERIR corrección)
try {
  await doSomething()
} catch (e) {}

// ❌ PROHIBIDO - Exponer detalles internos en producción
catch (error) {
  return NextResponse.json({ error: error.stack }, { status: 500 })
}
```

---

## 🏗️ REGLAS DE ARQUITECTURA

### Regla 2.1: Estructura de Directorios
**Severidad**: 🟡 MEDIA | **Estándar**: Next.js Best Practices

```
src/
├── app/                    # App Router (orquestación)
│   ├── (admin)/console/   # Panel SuperAdmin
│   ├── (app)/             # Dashboard por tenant
│   ├── (public)/          # Rutas públicas
│   ├── api/               # Endpoints REST
│   └── auth/              # Auth callbacks
│
├── modules/                # DOMINIO DE NEGOCIO
│   ├── customers/         # Módulo de clientes
│   ├── inventory/         # Módulo de inventario
│   └── sales/             # Módulo de ventas
│
├── core/                   # Infraestructura crítica
│   ├── billing/           # Facturación
│   ├── modules/           # Registry de módulos
│   └── security/          # Auditoría
│
├── components/
│   ├── ui/                # Shadcn/UI (no tocar)
│   └── layout/            # Navbar, Sidebar
│
├── providers/              # Context Providers
│   ├── AuthContext.tsx
│   ├── TenantContext.tsx
│   └── ModuleContext.tsx
│
└── lib/                    # Utilidades
    ├── schemas/           # Schemas Zod
    ├── logger.ts          # Logger centralizado
    └── supabase/          # Clientes Supabase
```

---

### Regla 2.2: Sistema de Módulos
**Severidad**: 🟠 ALTA | **Estándar**: Modular Architecture

```typescript
// ✅ CORRECTO - Usar ModuleContext
import { useModuleContext } from '@/providers/ModuleContext'

const { isModuleActive, activeModuleSlugs } = useModuleContext()

if (isModuleActive('work_orders')) {
  // Mostrar menú de órdenes de trabajo
}

// ❌ PROHIBIDO - Hardcodear módulos (SUGERIR corrección)
const modules = ['dashboard', 'inventory'] // Usar contexto
```

**Módulos disponibles**:
| Slug | Nombre | Tipo |
|------|--------|------|
| `dashboard` | Dashboard | Core |
| `inventory` | Inventario | Core |
| `customers` | Clientes | Core |
| `sales` | Ventas | Core |
| `purchases` | Compras | Standard |
| `work_orders` | Órdenes de Trabajo | Taller |
| `vehicles` | Vehículos | Taller |
| `reservations` | Reservas | Restaurante/Gym |
| `memberships` | Membresías | Gym |
| `reports` | Reportes | Standard |
| `billing` | Facturación | Core |
| `users` | Usuarios | Standard |
| `settings` | Configuración | Core |

---

### Regla 2.3: Multi-Tenancy
**Severidad**: 🔴 CRÍTICA | **Estándar**: SaaS Isolation

**Reglas de aislamiento**:
1. Cada tenant tiene UUID único en `tenants.id`
2. Todas las tablas operativas tienen `tenant_id`
3. RLS filtra por `get_current_user_tenant_id()`
4. Prohibido cruzar datos entre tenants

```sql
-- Política estándar RLS
CREATE POLICY tenant_isolation ON customers
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());
```

---

### Regla 2.4: Sistema de Roles
**Severidad**: 🔴 CRÍTICA | **Estándar**: RBAC

| Rol | Lectura | Escritura | Gestionar Usuarios |
|-----|---------|-----------|-------------------|
| SUPER_ADMIN | Todos los tenants | Todos los tenants | ✅ |
| OWNER | Todas las sedes | Todas las sedes | ✅ |
| ADMIN | Sede actual + hermanas* | Sede actual | ✅ |
| EMPLOYEE | Sede actual | Recursos asignados | ❌ |
| VIEWER | Sede actual | ❌ | ❌ |

*Si `can_read_sibling_locations = true`

---

### Regla 2.5: Server Components para Fetch
**Severidad**: 🟠 ALTA | **Estándar**: Next.js 16 Best Practices

```typescript
// ✅ CORRECTO - Server Component con fetch directo
export default async function CustomersPage() {
  const supabase = await createClient()
  const tenantId = await getRequiredTenantId()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, email')
    .eq('tenant_id', tenantId)
    .limit(100)

  return <CustomersClient initialCustomers={customers} />
}

// ❌ PROHIBIDO - Fetch en useEffect (SUGERIR migración)
export function CustomersPage() {
  const [data, setData] = useState()
  useEffect(() => {
    fetch('/api/customers').then(setData)
  }, [])
}
```

---

## 💻 REGLAS DE CÓDIGO

### Regla 3.1: Componentes React
**Severidad**: 🟠 ALTA | **Estándar**: React Best Practices

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/providers'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

// ✅ Schema de validación PRIMERO
const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof formSchema>

interface CustomerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ✅ Componente
export function CustomerForm({ open, onOpenChange }: CustomerFormProps) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      // Lógica
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* JSX */}
    </form>
  )
}
```

---

### Regla 3.2: Hooks Custom
**Severidad**: 🟠 ALTA | **Estándar**: React Hooks Best Practices

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/providers'

export interface Customer {
  id: string
  tenant_id: string
  first_name: string
  email: string
}

export function useCustomers() {
  const { user } = useUser()
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const loadCustomers = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('customers')
          .select('id, first_name, email, tenant_id')
          .eq('tenant_id', user.app_metadata?.tenant_id)
          .order('first_name', { ascending: true })

        if (error) throw error
        setCustomers(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [user?.id])

  const createCustomer = useCallback(async (data: Omit<Customer, 'id' | 'tenant_id'>) => {
    const { error } = await supabase
      .from('customers')
      .insert({ ...data, tenant_id: user.app_metadata?.tenant_id })

    if (error) throw error
  }, [user?.app_metadata?.tenant_id])

  return {
    customers,
    loading,
    error,
    createCustomer,
  }
}
```

---

### Regla 3.3: API Routes
**Severidad**: 🔴 CRÍTICA | **Estándar**: RESTful Best Practices

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ✅ Schema de validación
const createCustomerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // ✅ Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ Obtener tenant del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  }

  // ✅ Validar input
  const body = await request.json()
  const validation = createCustomerSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // ✅ Insertar con tenant_id
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...validation.data,
      tenant_id: profile.tenant_id,
    })
    .select('id, first_name, last_name, email')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

---

### Regla 3.4: Convenciones de Nomenclatura
**Severidad**: 🟡 MEDIA | **Estándar**: Code Consistency

**Archivos**:
- Componentes: `PascalCase.tsx` → `CustomerForm.tsx`
- Hooks: `camelCase.ts` → `useCustomers.ts`
- Utilidades: `camelCase.ts` → `formatCurrency.ts`
- Tipos: `PascalCase.ts` → `customer.types.ts`

**Funciones y Variables**:
- Funciones: `camelCase` → `getCustomerById`
- Componentes: `PascalCase` → `CustomerList`
- Constantes: `UPPER_SNAKE_CASE` → `MAX_CUSTOMERS`
- Types/Interfaces: `PascalCase` → `CustomerInput`

**Clases CSS (Tailwind)**:
- Orden: layout → box → typography → visual → interactive
- Usar `cn()` para conditional classes

---

### Regla 3.5: Utilidades y Helpers
**Severidad**: 🟡 MEDIA | **Estándar**: DRY Principle

```typescript
// ✅ src/lib/formatters.ts
export function formatCurrency(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
```

```typescript
// ✅ src/lib/validators.ts
import { z } from 'zod'

export const uuidSchema = z.string().uuid('ID inválido')
export const emailSchema = z.string().email('Email inválido')

export function isValidUUID(value: string): boolean {
  return uuidSchema.safeParse(value).success
}
```

---

## 🧪 REGLAS DE TESTING

### Regla 4.1: Cobertura de Tests
**Severidad**: 🟠 ALTA | **Estándar**: Testing Best Practices

**Requisitos mínimos**:
- Componentes críticos: ≥80% coverage
- Hooks custom: ≥90% coverage
- API routes: ≥85% coverage
- Servicios core: ≥90% coverage

```typescript
// ✅ CORRECTO - Test completo
import { render, screen, fireEvent } from '@testing-library/react'
import { CustomerForm } from './CustomerForm'

describe('CustomerForm', () => {
  it('should show validation error for empty name', async () => {
    render(<CustomerForm open onOpenChange={() => {}} />)

    const submitButton = screen.getByRole('button', { name: /guardar/i })
    fireEvent.click(submitButton)

    const error = await screen.findByText(/El nombre es requerido/i)
    expect(error).toBeInTheDocument()
  })

  it('should call onSubmit with valid data', async () => {
    const mockSubmit = vi.fn()
    render(<CustomerForm open onOpenChange={() => {}} onSubmit={mockSubmit} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'John' }
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    })

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com'
      })
    })
  })
})
```

---

### Regla 4.2: Tests de Seguridad
**Severidad**: 🔴 CRÍTICA | **Estándar**: Security Testing

```typescript
// ✅ CORRECTO - Test de cross-tenant access
describe('Cross-Tenant Security', () => {
  it('should not allow user from tenant A to access tenant B data', async () => {
    const tenantAUser = await loginAs('user-tenant-a')
    const tenantBProduct = await createProductInTenantB()

    const response = await request(app)
      .get(`/api/v1/products/${tenantBProduct.id}`)
      .set('Authorization', `Bearer ${tenantAUser.token}`)
      .set('X-Tenant-ID', tenantBProduct.tenant_id)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN_CROSS_TENANT')
  })

  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE products; --"

    const response = await request(app)
      .get(`/api/v1/products?search=${encodeURIComponent(maliciousInput)}`)
      .set('Authorization', validToken)

    expect(response.status).not.toBe(500)

    const products = await db.products.findMany()
    expect(products).toBeDefined()
  })
})
```

---

### Regla 4.3: Comandos de Testing
**Severidad**: 🟡 MEDIA | **Estándar**: CI/CD Best Practices

```bash
# Ejecutar tests
npm test

# Modo watch
npm run test:watch

# Con coverage
npm test -- --coverage

# Verificación completa
npm run check  # type-check + lint + test
```

---

## 📝 REGLAS DE DOCUMENTACIÓN

### Regla 5.1: JSDoc para Funciones Públicas
**Severidad**: 🟡 MEDIA | **Estándar**: Documentation Best Practices

```typescript
/**
 * Crea un nuevo cliente en la base de datos
 *
 * @param data - Datos del cliente a crear
 * @param data.first_name - Nombre del cliente
 * @param data.last_name - Apellido del cliente
 * @param data.email - Email del cliente
 * @returns El cliente creado con su ID
 * @throws {QuotaExceededException} Si se excede la cuota de clientes
 * @throws {ValidationError} Si los datos no son válidos
 *
 * @example
 * ```typescript
 * const customer = await createCustomer({
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   email: 'john@example.com'
 * })
 * ```
 */
export async function createCustomer(data: CreateCustomerDTO): Promise<Customer> {
  // Implementación
}
```

---

### Regla 5.2: Comentarios de Código
**Severidad**: 🟡 MEDIA | **Estándar**: Clean Code

```typescript
// ✅ CORRECTO - Explica el POR QUÉ
// Usamos debounce de 500ms para evitar queries excesivas
// mientras el usuario escribe en el buscador
const debouncedSearch = useDebouncedValue(searchTerm, 500)

// ✅ CORRECTO - Explica lógica compleja
// El trigger activa_modules se ejecuta después de INSERT en tenants
// y asigna los módulos según el plan y tipo de industria seleccionado
await supabase.from('tenants').insert({ ...data })

// ❌ PROHIBIDO - Comentarios obvios
// Incrementa i en 1
i = i + 1

// ❌ PROHIBIDO - Comentarios en español para código
// Itera sobre los clientes
customers.forEach(customer => {})
```

---

## 🔄 CICLO DE DESARROLLO

### Fase 1: Planificación
- [ ] Leer `docs/PROGRESS_TRACKER.md`
- [ ] Identificar tarea en `IMPLEMENTATION_ROADMAP.md`
- [ ] Consultar documentación específica (DATABASE_SCHEMA, API_SPEC, etc.)
- [ ] Definir criterio de éxito

### Fase 2: Implementación
- [ ] Seguir patrones establecidos en `MODULE_BLUEPRINT.md`
- [ ] Aplicar reglas de seguridad (RLS, Zod, tenant_id)
- [ ] Escribir tipos TypeScript explícitos
- [ ] Manejar errores y loading states

### Fase 3: Testing
- [ ] Escribir tests unitarios
- [ ] Escribir tests de seguridad (cross-tenant, SQL injection)
- [ ] Verificar cobertura mínima (80%+)
- [ ] Ejecutar `npm test`

### Fase 4: Validación
- [ ] Ejecutar `npm run check` (type-check + lint + test)
- [ ] Ejecutar `npm run build`
- [ ] Verificar que no hay errores
- [ ] Ejecutar `npm run security:audit`

### Fase 5: Commit
- [ ] Revisar `git diff`
- [ ] Commit con mensaje claro (Conventional Commits)
- [ ] Actualizar documentación si aplica
- [ ] Actualizar `PROGRESS_TRACKER.md`

---

## 🚨 CHECKLIST PRE-COMMIT

### Código
- [ ] No dejé `console.log` (usar `logger.ts`)
- [ ] No usé `any` (usar tipos o `unknown`)
- [ ] No hice `select('*')` (campos explícitos)
- [ ] Validé inputs con Zod
- [ ] Respété RLS (tenant_id en queries)
- [ ] Manejé errores con try/catch
- [ ] Manejé loading states

### Seguridad
- [ ] Verifiqué autenticación con `getUser()`
- [ ] Verifiqué permisos por rol
- [ ] No expuse datos sensibles
- [ ] No hardcodeé secrets
- [ ] Saniticé logs (no PII)

### Testing
- [ ] Tests existentes pasan: `npm test`
- [ ] Agregué tests para nueva funcionalidad
- [ ] Coverage no disminuyó
- [ ] Tests de seguridad incluidos

### Calidad
- [ ] `npm run lint` pasa
- [ ] `npm run format` aplicado
- [ ] `npm run type-check` pasa
- [ ] `npm run build` pasa

### Documentación
- [ ] Actualicé documentación si cambié algo
- [ ] Agregué JSDoc a funciones públicas
- [ ] Comentarios explican el POR QUÉ, no el QUÉ

---

## 📊 MÉTRICAS DE CALIDAD

### Security Score
```typescript
interface SecurityScore {
  rlsCoverage: number           // % tablas con RLS (meta: 100%)
  selectStarCount: number       // Debe ser 0
  anyTypeCount: number          // Debe ser 0 (actual: 64)
  zodValidationCoverage: number // % inputs validados (meta: 100%)
  tenantIsolationScore: number  // % queries con tenant_id (meta: 100%)
}
```

### Code Quality Score
```typescript
interface CodeQualityScore {
  typeSafety: number      // % código tipado correctamente (meta: 100%)
  errorHandling: number   // % funciones con error handling (meta: 100%)
  testCoverage: number    // % código cubierto por tests (meta: 80%)
  documentation: number   // % funciones documentadas (meta: 90%)
}
```

---

## 🔗 INTEGRACIÓN CON SECURITY PIPELINE

### Comandos de Auditoría
```bash
# Ejecutar auditoría completa
npm run security:audit    # Genera reporte MD + JSON

# Validar reporte JSON
npm run security:validate # Valida umbrales críticos
```

### Umbrales Críticos (Pipeline falla si excede)
| Hallazgo | Umbral | Severidad |
|----------|--------|-----------|
| Type errors | > 0 | CRÍTICA |
| `any` types | > 0 | ALTA |
| `console.log` | > 0 | ALTA |
| `select('*')` | > 0 | CRÍTICA |
| Missing RLS | > 0 | CRÍTICA |
| Vulnerabilidades críticas | > 0 | CRÍTICA |
| Vulnerabilidades altas | > 0 | ALTA |
| Tests fallidos | > 0 | CRÍTICA |

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

## 📚 REFERENCIAS

### Estándares de Seguridad
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ISO/IEC 27001:2022](https://www.iso.org/standard/27001)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Cloud Security Alliance](https://cloudsecurityalliance.org/)

### Documentación del Proyecto
- [SECURITY_QUICK_REFERENCE.md](../docs/security/SECURITY_QUICK_REFERENCE.md)
- [SECURITY_CHECKLIST.md](../docs/security/SECURITY_CHECKLIST.md)
- [SECURITY_PLAYBOOK_SaaS.md](../docs/security/SECURITY_PLAYBOOK_SaaS.md)
- [PROMPT_MAESTRO_COORDINACION.md](../docs/ai-coordination/PROMPT_MAESTRO_COORDINACION.md)
- [ARCHITECTURE_SUMMARY.md](../ARCHITECTURE_SUMMARY.md)
- [CONTEXTO_DEL_PROYECTO.md](../docs/CONTEXTO_DEL_PROYECTO.md)

### Herramientas
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn/UI Docs](https://ui.shadcn.com)
- [Zod Docs](https://zod.dev)
- [Vitest Docs](https://vitest.dev)

---

## ✅ CHECKLIST DE CONFIGURACIÓN ANTIGRAVITY

- [x] Reglas de seguridad definidas (OWASP, ISO 27001)
- [x] Reglas de arquitectura definidas (Multi-tenant, Módulos)
- [x] Reglas de código definidas (TypeScript, React)
- [x] Reglas de testing definidas (Vitest, Security)
- [x] Reglas de documentación definidas (JSDoc, Comentarios)
- [x] Integración con Qwen CLI configurada
- [x] Canales de comunicación definidos
- [x] Métricas de calidad establecidas
- [x] Checklist pre-commit definida
- [x] Umbrales de pipeline definidos

---

**Fin del Documento de Reglas Básicas**

*¿Necesitas más detalles? Consulta la documentación específica en `docs/` o `ARCHITECTURE_SUMMARY.md` en la raíz.*

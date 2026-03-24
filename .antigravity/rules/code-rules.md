# 💻 Antigravity Code Rules

## Reglas de Código TypeScript/React

### 1. Componentes React

#### Estructura Obligatoria

```typescript
'use client' // Si usa hooks

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

// ✅ Componente
export function CustomerForm() {
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

#### Reglas Específicas

| Regla | Prioridad | Ejemplo |
|-------|-----------|---------|
| Usar `useUser()` para auth | CRÍTICA | `const { user } = useUser()` |
| Validar con Zod | CRÍTICA | `zodResolver(schema)` |
| Manejar loading state | ALTA | `useState(false)` |
| Manejar errores | ALTA | `try/catch` con `toast.error` |
| Tipar props | CRÍTICA | `interface Props { ... }` |
| Usar `cn()` para clases | MEDIA | `cn('base', condition && 'active')` |

---

### 2. Hooks Custom

#### Estructura Obligatoria

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/providers'

export interface Customer {
  id: string
  tenant_id: string
  name: string
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
          .select('id, name, email, tenant_id')
          .eq('tenant_id', user.app_metadata?.tenant_id)
          .order('name', { ascending: true })

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

#### Reglas Específicas

| Regla | Prioridad | Ejemplo |
|-------|-----------|---------|
| Verificar `user?.id` | CRÍTICA | `if (!user?.id) return` |
| Especificar columnas | CRÍTICA | `.select('id, name')` |
| Filtrar por tenant | CRÍTICA | `.eq('tenant_id', tenantId)` |
| Manejar loading | ALTA | `useState(true)` |
| Manejar errores | ALTA | `try/catch` con `setError` |
| Usar `useCallback` | MEDIA | Para funciones expuestas |
| Cleanup en useEffect | ALTA | Retornar función cleanup |

---

### 3. API Routes

#### Estructura Obligatoria

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ✅ Schema de validación
const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
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
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

#### Reglas Específicas

| Regla | Prioridad | Ejemplo |
|-------|-----------|---------|
| Verificar auth | CRÍTICA | `getUser()` |
| Validar con Zod | CRÍTICA | `schema.safeParse()` |
| Filtrar por tenant | CRÍTICA | `tenant_id` en queries |
| Retornar errores | ALTA | `NextResponse.json({}, { status })` |
| Especificar columnas | CRÍTICA | `.select('id, name')` |

---

### 4. Tipos TypeScript

#### Interfaces vs Types

```typescript
// ✅ Usar interface para objetos
interface Customer {
  id: string
  tenant_id: string
  name: string
  email: string
}

// ✅ Usar type para unions
type UserRole = 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'

type ModuleStatus = 'ACTIVE' | 'INACTIVE' | 'RESTRICTED'

// ✅ Usar type para inferidos de Zod
type CustomerInput = z.infer<typeof customerSchema>

// ❌ PROHIBIDO - any
const data: any = await fetch()

// ✅ Usar unknown si es necesario
const data: unknown = await fetch()
```

#### Database Types

```typescript
// ✅ Importar tipos generados de Supabase
import { Database } from '@/lib/supabase/database.types'

type CustomerRow = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']
```

---

### 5. Utilidades y Helpers

#### Format Helpers

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

#### Validación de IDs

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

## Patrones Prohibidos

### ❌ NUNCA Hacer Esto

```typescript
// ❌ any en TypeScript
const data: any = []

// ❌ select('*')
const { data } = await supabase.from('table').select('*')

// ❌ console.log en producción
console.log('User data:', user)

// ❌ Hardcodear secrets
const apiKey = 'sk_123456'

// ❌ Sin validación de inputs
const data = await request.json()

// ❌ Sin verificar auth
export async function GET() {
  const data = await supabase.from('table').select()
  return NextResponse.json(data)
}

// ❌ Sin filtrar por tenant
const customers = await supabase.from('customers').select()

// ❌ Error handling vacío
try {
  await doSomething()
} catch (e) {}
```

---

## Checklist de Código

### Antes de Commit

- [ ] TypeScript sin errores (`npm run type-check`)
- [ ] ESLint sin errores (`npm run lint`)
- [ ] Tests pasando (`npm test`)
- [ ] Sin `any` ni `select('*')`
- [ ] Sin `console.log` en producción
- [ ] Validación Zod en inputs
- [ ] RLS verificado en queries
- [ ] Filtrado por `tenant_id`

### Revisión de PR

| Categoría | Puntos a Verificar |
|-----------|-------------------|
| Seguridad | Auth, RLS, tenant isolation, validación |
| Tipos | Sin `any`, tipos explícitos, database types |
| Performance | Select de columnas específicas, índices |
| Testing | Tests unitarios, edge cases |
| Código | Limpio, legible, sigue convenciones |

---

## Herramientas de Validación

### Comandos Locales

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm test

# Todo junto
npm run check

# Security audit
npm run security:audit
```

### Validación Automática (CI/CD)

El pipeline falla si detecta:

| Hallazgo | Umbral | Acción |
|----------|--------|--------|
| Type errors | > 0 | ❌ Fallar |
| `any` types | > 0 | ❌ Fallar |
| `console.log` | > 0 | ⚠️ Advertir |
| `select('*')` | > 0 | ❌ Fallar |
| Missing RLS | > 0 | ❌ Fallar |
| Tests fallidos | > 0 | ❌ Fallar |

---

## Referencias

- [SECURITY_QUICK_REFERENCE.md](../../docs/security/SECURITY_QUICK_REFERENCE.md)
- [PROMPT_ANTIGRAVITY.md](./PROMPT_ANTIGRAVITY.md)
- TypeScript Handbook
- React Best Practices
- Next.js Documentation

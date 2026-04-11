---
name: backend-api
description: >
  Diseño e implementación de API Routes, Server Actions, middleware y lógica
  de servidor en Next.js con Supabase. Usar cuando el usuario quiera: crear
  endpoints, server actions, middleware, validaciones con Zod, manejo de errores,
  integración con servicios externos (MercadoPago, Resend, etc.), o cualquier
  lógica que corra en el servidor. Activar con: API, endpoint, route, server
  action, middleware, validación, integración, webhook, backend.
---

# Backend y API

## Principios fundamentales

1. **Nunca confiar en el cliente** — validar todo en el servidor
2. **Tenant ID siempre del JWT** — nunca del body de la request
3. **Zod para toda validación** — nunca validar manualmente
4. **Errores explícitos** — nunca swallow silencioso
5. **Un endpoint = una responsabilidad** — SRP aplicado a rutas

---

## Estructura de API Routes

### Naming convention
```
/api/v1/[recurso]/route.ts          → CRUD del recurso
/api/v1/[recurso]/[id]/route.ts     → Operaciones por ID
/api/v1/[recurso]/[id]/[accion]/route.ts → Acciones específicas
/api/v1/public/[recurso]/route.ts   → Endpoints públicos sin auth
```

### Template de API Route protegida
```typescript
// src/app/api/v1/[recurso]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema de validación
const createSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().int().positive(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Tenant ID del JWT — nunca del request
    const tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Sin tenant' }, { status: 403 })
    }

    // 3. Query con límite y columnas específicas
    const { data, error } = await supabase
      .from('recursos')
      .select('id, name, price, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/v1/recursos]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Sin tenant' }, { status: 403 })
    }

    // Validar body con Zod
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('recursos')
      .insert({ ...parsed.data, tenant_id: tenantId })
      .select('id, name, price')
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/v1/recursos]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

---

## Server Actions

### Cuándo usar Server Actions vs API Routes

| Server Actions | API Routes |
|---------------|-----------|
| Formularios React | Llamadas desde JS externo |
| Mutaciones simples | Webhooks de terceros |
| Operaciones con redirect | APIs públicas |
| revalidatePath/revalidateTag | Integración con servicios |

### Template de Server Action
```typescript
// src/app/[módulo]/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  field: z.string().min(1),
})

export async function createRecurso(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/onboarding')

  const parsed = schema.safeParse({
    field: formData.get('field'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('recursos')
    .insert({ ...parsed.data, tenant_id: tenantId })

  if (error) {
    return { error: { general: error.message } }
  }

  revalidatePath('/recursos')
  return { success: true }
}
```

---

## Validación con Zod

### Schemas por dominio
```typescript
// src/lib/schemas/[dominio].ts

import { z } from 'zod'

// Base reutilizable
const baseSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
})

// Schema de creación
export const createProductSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  price: z.number().int().positive('Precio debe ser positivo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Categoría requerida'),
})

// Schema de actualización (todos opcionales)
export const updateProductSchema = createProductSchema.partial()

// Tipos derivados
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
```

---

## Manejo de errores

### Respuestas estándar
```typescript
// src/lib/api/response.ts

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(
  message: string,
  code: string,
  status: number
) {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status }
  )
}

// Uso:
return apiSuccess({ id: newRecord.id }, 201)
return apiError('No encontrado', 'NOT_FOUND', 404)
return apiError('No autorizado', 'UNAUTHORIZED', 401)
return apiError('Datos inválidos', 'VALIDATION_ERROR', 400)
```

---

## Integración con servicios externos

### MercadoPago — estructura
```typescript
// src/lib/integrations/mercadopago.ts

const MP_BASE_URL = 'https://api.mercadopago.com'

export async function createSubscription(params: {
  tenantId: string
  planSlug: string
  billingCycle: 'monthly' | 'yearly'
}) {
  const price = await getIndustryPrice(params.tenantId, params.planSlug)
  
  const response = await fetch(`${MP_BASE_URL}/preapproval`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      preapproval_plan_id: process.env.MP_PLAN_ID,
      reason: `Antigravity ${params.planSlug}`,
      auto_recurring: {
        frequency: params.billingCycle === 'monthly' ? 1 : 12,
        frequency_type: 'months',
        transaction_amount: price,
        currency_id: 'COP',
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
    }),
  })
  
  if (!response.ok) throw new Error('Error creando suscripción en MP')
  return response.json()
}
```

### Webhooks — verificar firma
```typescript
// src/app/api/webhooks/[provider]/route.ts

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-signature')
  
  // Siempre verificar la firma del webhook
  const isValid = verifyWebhookSignature(body, signature, process.env.WEBHOOK_SECRET!)
  if (!isValid) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const event = JSON.parse(body)
  
  // Procesar según tipo de evento
  switch (event.type) {
    case 'payment.approved':
      await handlePaymentApproved(event.data)
      break
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(event.data)
      break
  }

  return NextResponse.json({ received: true })
}
```

---

## Checklist de API

```
Seguridad:
[ ] Autenticación verificada (getUser())
[ ] Tenant ID del JWT, no del body
[ ] Rate limiting en endpoints sensibles
[ ] Validación de input con Zod
[ ] No exponer stack traces en producción

Calidad:
[ ] Un endpoint = una responsabilidad
[ ] Manejo de errores con mensajes claros
[ ] Logging de errores en servidor
[ ] Status codes HTTP correctos (200/201/400/401/403/404/500)
[ ] Respuestas consistentes con apiSuccess/apiError

Performance:
[ ] Queries con límite
[ ] Columnas específicas (no select *)
[ ] Índices en columnas filtradas
[ ] Paginación para listas grandes
```

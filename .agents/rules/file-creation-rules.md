---
trigger: on_file_create
glob: "**/*.{ts,tsx}"
description: Reglas para creación de nuevos archivos TypeScript/React
---

# 📝 Reglas para Creación de Archivos Nuevos

## Estructura Obligatoria por Tipo de Archivo

### 1. Componentes React (.tsx)

```typescript
'use client' // Si usa hooks o interacción

// Imports organizados
import { useState, useEffect } from 'react'
import { useUser } from '@/providers'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

// Schema de validación PRIMERO
const formSchema = z.object({
  // campos
})

type FormData = z.infer<typeof formSchema>

// Interfaces de props
interface ComponentProps {
  // props
}

// Componente
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  // Handlers
  async function handleSubmit(data: FormData) {
    setLoading(true)
    try {
      // Lógica
    } catch (error) {
      logger.error('Error en componente', { error })
      toast.error('Mensaje de error')
    } finally {
      setLoading(false)
    }
  }

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

---

### 2. Hooks Custom (.ts)

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/providers'

// Interfaces exportadas
export interface Entity {
  id: string
  tenant_id: string
  // campos
}

// Hook
export function useEntity() {
  const { user } = useUser()
  const supabase = createClient()
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const loadEntities = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('entities')
          .select('id, tenant_id, campos_especificos')
          .eq('tenant_id', user.app_metadata?.tenant_id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setEntities(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        logger.error('Error cargando entidades', { error: err })
      } finally {
        setLoading(false)
      }
    }

    loadEntities()
  }, [user?.id])

  // Funciones expuestas
  const createEntity = useCallback(async (data: Omit<Entity, 'id' | 'tenant_id'>) => {
    const { error } = await supabase
      .from('entities')
      .insert({ ...data, tenant_id: user.app_metadata?.tenant_id })

    if (error) throw error
  }, [user?.app_metadata?.tenant_id])

  return {
    entities,
    loading,
    error,
    createEntity,
  }
}
```

---

### 3. API Routes (.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

// Schema de validación
const operationSchema = z.object({
  // campos
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Obtener tenant del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  }

  // 3. Validar input
  const body = await request.json()
  const validation = operationSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  try {
    // 4. Ejecutar operación con tenant_id
    const { data, error } = await supabase
      .from('table')
      .insert({
        ...validation.data,
        tenant_id: profile.tenant_id,
      })
      .select('id, campos_especificos')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Error en API route', { error, body: validation.data })
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### 4. Server Actions (.ts)

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getRequiredTenantId } from '@/lib/supabase/auth'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { auditLogService } from '@/core/security/audit.service'

// Schema de validación
const actionSchema = z.object({
  // campos
})

export async function entityAction(rawData: unknown) {
  // 1. Validar input con Zod
  const data = actionSchema.parse(rawData)

  try {
    const supabase = await createClient()

    // 2. Resolver tenant en servidor
    const tenantId = await getRequiredTenantId()

    // 3. Ejecutar operación
    const { data: result, error } = await supabase
      .from('table')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error

    // 4. Auditar acción
    await auditLogService.log({
      action: 'CREATE',
      entityType: 'entity',
      entityId: result.id,
      tenantId,
    })

    // 5. Revalidar cache
    revalidatePath('/entity-path')

    return result
  } catch (error) {
    logger.error('Error en server action', { error, data })
    Sentry.captureException(error)
    throw error
  }
}
```

---

### 5. Servicios (.ts)

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// DTOs
export interface CreateEntityDTO {
  field1: string
  field2: number
  tenant_id: string
}

export interface Entity {
  id: string
  tenant_id: string
  field1: string
  field2: number
}

// Schema de validación
export const createEntitySchema = z.object({
  field1: z.string().min(1).max(100),
  field2: z.number().positive(),
})

// Servicio con Dependency Injection
export class EntityService {
  constructor(private supabase: SupabaseClient) {}

  async list(tenantId: string, limit = 100) {
    const { data, error } = await this.supabase
      .from('entities')
      .select('id, tenant_id, field1, field2')
      .eq('tenant_id', tenantId)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error listing entities', { error, tenantId })
      throw error
    }

    return data.map(this.mapToDomain)
  }

  async create(data: CreateEntityDTO) {
    const { data: entity, error } = await this.supabase
      .from('entities')
      .insert(data)
      .select()
      .single()

    if (error) {
      logger.error('Error creating entity', { error, data })
      throw error
    }

    return this.mapToDomain(entity)
  }

  async findById(id: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('entities')
      .select('id, tenant_id, field1, field2')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    if (!data) return null

    return this.mapToDomain(data)
  }

  async update(id: string, tenantId: string, data: Partial<CreateEntityDTO>) {
    const { data: entity, error } = await this.supabase
      .from('entities')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return this.mapToDomain(entity)
  }

  async delete(id: string, tenantId: string) {
    const { error } = await this.supabase
      .from('entities')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  private mapToDomain(dbEntity: any): Entity {
    return {
      id: dbEntity.id,
      tenant_id: dbEntity.tenant_id,
      field1: dbEntity.field1,
      field2: dbEntity.field2,
    }
  }
}
```

---

### 6. Tipos TypeScript (.ts)

```typescript
import { z } from 'zod'

// Tipos primitivos
export type UUID = string
export type Email = string
export type Timestamp = Date

// Enums
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
export type ModuleStatus = 'ACTIVE' | 'INACTIVE' | 'RESTRICTED' | 'DORMANT' | 'ERROR'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended'

// Interfaces de dominio
export interface Tenant {
  id: UUID
  name: string
  industry_type: string
  plan: string
  is_active: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

export interface User {
  id: UUID
  tenant_id: UUID
  email: Email
  role: UserRole
  created_at: Timestamp
}

// DTOs para operaciones
export interface CreateTenantDTO {
  name: string
  industry_type: string
  plan?: string
}

export interface UpdateTenantDTO {
  name?: string
  industry_type?: string
  is_active?: boolean
}

// Schemas Zod
export const tenantSchema = z.object({
  name: z.string().min(2).max(100),
  industry_type: z.string(),
  plan: z.string().default('free'),
})

export type TenantInput = z.infer<typeof tenantSchema>

// Tipos utilitarios
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Nullable<T> = T | null
export type AsyncResult<T> = Promise<{ data: T | null; error: Error | null }>
```

---

### 7. Migraciones SQL (.sql)

```sql
-- Migration: description_of_change
-- Date: YYYY-MM-DD
-- Author: name

BEGIN;

-- Crear tabla (si aplica)
CREATE TABLE IF NOT EXISTS public.table_name (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    field1          TEXT NOT NULL,
    field2          INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_table_tenant ON public.table_name(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_field ON public.table_name(field1);

-- RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "table_tenant_isolation"
ON public.table_name FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Trigger para updated_at
CREATE TRIGGER update_table_updated_at
    BEFORE UPDATE ON public.table_name
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
```

---

## Checklist de Creación de Archivos

### Antes de Crear
- [ ] El archivo es necesario (no hay duplicados)
- [ ] La ubicación sigue la estructura del proyecto
- [ ] El nombre sigue las convenciones (PascalCase/camelCase)

### Después de Crear
- [ ] Imports organizados (externos → internos → relativos)
- [ ] Tipos TypeScript explícitos (prohibido `any`)
- [ ] Schema Zod para validación (si aplica)
- [ ] Error handling con try/catch
- [ ] Loading states (si aplica)
- [ ] Logger en lugar de console.log
- [ ] JSDoc para funciones públicas
- [ ] Tests escritos/actualizados

### Validación Automática
```bash
# Verificar que el archivo compila
npm run type-check

# Verificar linting
npm run lint

# Verificar formato
npm run format

# Ejecutar tests
npm test
```

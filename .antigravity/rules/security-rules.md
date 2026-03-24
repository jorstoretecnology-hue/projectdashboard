# 🔐 Antigravity Security Rules

## Reglas Obligatorias de Seguridad

### 1. Row Level Security (RLS)
**Regla:** TODAS las queries a la base de datos DEBEN usar RLS.

```typescript
// ✅ CORRECTO
const { data } = await supabase
  .from('profiles')
  .select('id, tenant_id')
  .eq('id', userId)
  .single()

// ❌ PROHIBIDO - Sin RLS
const { data } = await supabase
  .from('profiles')
  .select('*')
```

**Validación:**
- Todas las tablas deben tener `ENABLE ROW LEVEL SECURITY`
- Políticas deben usar `get_current_user_tenant_id()` o `auth.uid()`
- Prohibido `bypassRLS(true)` excepto en migraciones con comentario explícito

---

### 2. Prohibido `select('*')`
**Regla:** NUNCA usar `select('*')`. Especificar columnas explícitamente.

```typescript
// ✅ CORRECTO
.select('id, name, email, tenant_id')

// ❌ PROHIBIDO
.select('*')
```

**Razón:** 
- Previene leakage de datos sensibles
- Mejora performance
- Cumple con principio de mínimo privilegio (ISO 27001)

---

### 3. Validación de Inputs con Zod
**Regla:** TODOS los inputs de usuario deben validarse con Zod.

```typescript
// ✅ CORRECTO
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  tenant_id: z.string().uuid(),
})

// ❌ PROHIBIDO - Sin validación
const data = await request.json()
```

---

### 4. TypeScript Estricto - Prohibido `any`
**Regla:** NUNCA usar `any`. Usar tipos explícitos o `unknown`.

```typescript
// ✅ CORRECTO
interface Profile {
  id: string
  tenant_id: string
  app_role: UserRole
}

// ❌ PROHIBIDO
const data: any = await fetchData()
```

---

### 5. Gestión de Secretos
**Regla:** Los secretos NUNCA se hardcodean. Usar `process.env`.

```typescript
// ✅ CORRECTO
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// ❌ PROHIBIDO
const supabaseUrl = 'https://abc123.supabase.co'
```

---

### 6. Logging Seguro
**Regla:** 
- Prohibido `console.log` en producción
- Usar `Sentry` o sistema de logs centralizado
- NUNCA loguear: passwords, tokens, PII

```typescript
// ✅ CORRECTO
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)

// ❌ PROHIBIDO en producción
console.log('User password:', password)
```

---

### 7. Autenticación y Autorización
**Regla:** 
- Verificar `auth.uid()` en cada RPC
- Validar `app_metadata.app_role` para rutas admin
- MFA obligatorio en paneles críticos

```typescript
// ✅ CORRECTO
const { data: { user } } = await supabase.auth.getUser()
if (!user || user.app_metadata?.app_role !== 'SUPER_ADMIN') {
  throw new Error('Unauthorized')
}
```

---

### 8. Multi-Tenant Isolation
**Regla:** TODAS las queries deben filtrar por `tenant_id`.

```typescript
// ✅ CORRECTO
.eq('tenant_id', get_current_user_tenant_id())

// ❌ PROHIBIDO - Sin filtro tenant
.from('customers').select()
```

---

## Checklist de Seguridad por Archivo

### Componentes React
- [ ] Usa `useUser()` para verificar autenticación
- [ ] No expone datos sensibles en props
- [ ] Valida inputs con Zod antes de enviar a API

### API Routes
- [ ] Verifica autenticación con `createClient()`
- [ ] Valida inputs con Zod schema
- [ ] Filtra por `tenant_id`
- [ ] Usa tipos TypeScript explícitos

### Migraciones SQL
- [ ] Habilita RLS en nuevas tablas
- [ ] Crea políticas de aislamiento
- [ ] No usa `bypassRLS` sin comentario explícito
- [ ] Incluye `deleted_at` para soft delete

### Hooks Custom
- [ ] Maneja estados de loading/error
- [ ] Verifica `user?.id` antes de queries
- [ ] Limpia subscriptions en cleanup

---

## Monitoreo Runtime

Antigravity debe alertar sobre:

| Hallazgo | Severidad | Acción |
|----------|-----------|--------|
| `select('*')` detectado | CRÍTICA | Bloquear commit |
| `any` en TypeScript | ALTA | Sugerir tipo explícito |
| `console.log` en prod | ALTA | Reemplazar con Sentry |
| Query sin `tenant_id` | CRÍTICA | Agregar filtro tenant |
| Input sin validación Zod | ALTA | Agregar schema |
| RLS faltante en tabla | CRÍTICA | Crear política |

---

## Referencias

- [SECURITY_QUICK_REFERENCE.md](../../docs/security/SECURITY_QUICK_REFERENCE.md)
- [PROMPT_MAESTRO_COORDINACION.md](../ai-coordination/PROMPT_MAESTRO_COORDINACION.md)
- OWASP Top 10
- ISO/IEC 27001:2022
- NIST CSF

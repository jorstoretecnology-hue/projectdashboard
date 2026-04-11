---
name: auth-security
description: >
  Implementación segura de autenticación, autorización, gestión de sesiones
  y seguridad general en aplicaciones web con Supabase Auth y Next.js.
  Usar cuando el usuario quiera: implementar login, registro, recuperación
  de contraseña, roles y permisos, protección de rutas, tokens JWT, rate
  limiting, validación de seguridad, auditoría, o resolver vulnerabilidades.
  Activar con: auth, login, sesión, token, JWT, rol, permiso, seguridad,
  contraseña, OAuth, middleware, proteger, vulnerabilidad, OWASP.
---

# Autenticación y Seguridad

## Modelo de seguridad — capas

```
Capa 1 — Red (Cloudflare WAF)
  → Bloquea ataques DDoS y bots antes de llegar a la app

Capa 2 — Middleware / Proxy (src/proxy.ts)
  → Verifica sesión activa
  → Redirige según rol
  → Rate limiting

Capa 3 — API Routes / Server Actions
  → Verifica autenticación en cada request
  → Obtiene tenant_id del JWT
  → Valida permisos por rol

Capa 4 — Base de datos (RLS)
  → Última línea de defensa
  → Ninguna query puede bypassear el tenant_id
  → Deny by default
```

---

## Flujos de autenticación

### Login
```typescript
// src/app/auth/login/page.tsx — Client Component
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Cooldown client-side (complemento al rate limiting del servidor)
    setCooldown(true)
    setTimeout(() => setCooldown(false), 2000)
    toast.error('Credenciales incorrectas')
    return
  }

  // Dejar que post-auth maneje la redirección por rol
  router.push('/post-auth')
}
```

### Post-auth — redirección por rol
```typescript
// src/app/post-auth/page.tsx
export default async function PostAuthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  const role = user.app_metadata?.app_role
  const tenantId = user.app_metadata?.tenant_id

  if (role === 'SUPER_ADMIN') redirect('/console/dashboard')
  if (!tenantId) redirect('/onboarding')
  redirect('/dashboard')
}
```

### Recuperación de contraseña — OTP 6 dígitos (recomendado)
```typescript
// Configurar en Supabase Dashboard → Auth → Email Templates
// Usar {{ .Token }} en lugar de {{ .ConfirmationURL }}

// src/app/auth/verify/page.tsx — verificar OTP
const handleVerify = async (token: string) => {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  })
  
  if (error) {
    toast.error('Código inválido o expirado')
    return
  }
  
  router.push('/auth/reset-password')
}
```

---

## Protección de rutas — proxy.ts

```typescript
// src/proxy.ts
export async function proxy(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Rate limiting
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
    const { success } = await ratelimit.limit(ip)
    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  } catch {
    // Continuar si rate limiting falla
  }

  const { pathname } = request.nextUrl

  // Rutas públicas — no requieren auth
  const PUBLIC_PATHS = [
    '/auth/login', '/auth/register', '/auth/callback',
    '/auth/forgot-password', '/auth/reset-password', '/auth/verify',
    '/api/v1/public', '/tracking',
  ]
  
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Sin sesión → login
  if (!user) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const role = user.app_metadata?.app_role
  const tenantId = user.app_metadata?.tenant_id

  // Super admin routes
  if (pathname.startsWith('/console')) {
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Rutas de tenant — necesitan tenant_id
  if (!tenantId && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Headers de contexto para Server Components
  const headers = new Headers(request.headers)
  headers.set('x-user-id', user.id)
  headers.set('x-user-role', role ?? 'VIEWER')
  if (tenantId) headers.set('x-tenant-id', tenantId)

  return NextResponse.next({ request: { headers } })
}
```

---

## Roles y permisos

### Jerarquía de roles
```
SUPER_ADMIN
  → Acceso a /console/*
  → Ve todos los tenants
  → Sin restricciones de RLS de tenant

OWNER
  → Acceso completo al tenant
  → Puede invitar usuarios
  → Puede cambiar plan

ADMIN
  → Acceso a configuración
  → Puede gestionar usuarios del tenant
  → No puede cambiar plan

EMPLOYEE
  → Acceso operativo (ventas, inventario, clientes)
  → No puede acceder a configuración ni billing

VIEWER
  → Solo lectura
  → Sin acceso a información financiera
```

### Verificación de rol en API
```typescript
function hasRole(userRole: string, allowedRoles: string[]): boolean {
  const hierarchy = ['VIEWER', 'EMPLOYEE', 'ADMIN', 'OWNER', 'SUPER_ADMIN']
  const userLevel = hierarchy.indexOf(userRole)
  return allowedRoles.some(role => hierarchy.indexOf(role) <= userLevel)
}

// En API route:
const userRole = user.app_metadata?.app_role
if (!hasRole(userRole, ['OWNER', 'ADMIN'])) {
  return apiError('Permisos insuficientes', 'FORBIDDEN', 403)
}
```

---

## Gestión de contraseñas

### Reglas mínimas
```typescript
const passwordSchema = z.string()
  .min(12, 'Mínimo 12 caracteres')
  .regex(/[A-Z]/, 'Al menos una mayúscula')
  .regex(/[a-z]/, 'Al menos una minúscula')
  .regex(/[0-9]/, 'Al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Al menos un carácter especial')
```

### Nunca hardcodear contraseñas
```typescript
// ❌ NUNCA
password: password || 'Password123!'

// ✅ SIEMPRE
import crypto from 'crypto'
password: password || crypto.randomBytes(16).toString('hex')
```

---

## Variables de entorno

### Clasificación de variables
```bash
# SEGURAS para el cliente (prefijo NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# SOLO en servidor (nunca exponer al cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Acceso total a DB
MP_ACCESS_TOKEN=APP_USR...         # MercadoPago
RESEND_API_KEY=re_...              # Emails
SUPERADMIN_CREATION_SECRET=...    # Script de superadmin
WEBHOOK_SECRET=...                 # Verificación webhooks
```

### Validar variables al arrancar
```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MP_ACCESS_TOKEN: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

---

## Auditoría de seguridad

### Checklist OWASP Top 10 aplicado

```
A01 - Control de acceso:
[ ] RLS habilitado en todas las tablas
[ ] tenant_id siempre del JWT, nunca del body
[ ] Roles verificados en servidor, no solo en UI

A02 - Fallos criptográficos:
[ ] Contraseñas hasheadas por Supabase Auth
[ ] Tokens firmados con secreto seguro
[ ] HTTPS forzado en producción

A03 - Inyección:
[ ] Queries con parámetros (Supabase lo hace automáticamente)
[ ] Nunca concatenar SQL manualmente

A05 - Mala configuración:
[ ] service_role_key solo en servidor
[ ] Variables de entorno no en código
[ ] Headers de seguridad configurados

A07 - Fallos de autenticación:
[ ] Rate limiting en login
[ ] OTP expirable para recuperación
[ ] Sin contraseñas hardcodeadas

A09 - Logging insuficiente:
[ ] Sentry configurado para errores
[ ] audit_logs para operaciones críticas
[ ] Logs de intentos de acceso fallidos
```

---

## Prueba de penetración entre tenants

### Script de prueba básica
```typescript
// test/security/tenant-isolation.test.ts

describe('Tenant Isolation', () => {
  it('Tenant A no puede ver datos de Tenant B', async () => {
    // Login como usuario del Tenant A
    const { data: { session } } = await supabaseA.auth.signInWithPassword({
      email: 'user-a@testa.com',
      password: 'password-a'
    })

    // Intentar acceder a un ID conocido del Tenant B
    const { data, error } = await supabaseA
      .from('customers')
      .select('*')
      .eq('id', KNOWN_CUSTOMER_ID_FROM_TENANT_B)
      .single()

    // Debe retornar null — RLS bloquea el acceso
    expect(data).toBeNull()
  
---

## 🔐 RBAC & APPROLE MATRIX (MASTER PROMPT)

**Contexto:** Arquitectura SaaS v5.5.0.

### Matriz de Permisos (AppRole)

| AppRole | Clientes | Crear | Editar | Reportes | Invitar | Billing |
|---------|----------|-------|--------|----------|---------|---------|
| OWNER | ✅ Propio | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ Propio | ✅ | ✅ | ✅ | ❌ | ❌ |
| EMPLOYEE| ✅ Propio | ✅ | ✅ | ❌ | ❌ | ❌ |
| VIEWER | ✅ Propio | ❌ | ❌ | ✅ | ❌ | ❌ |

### Implementación Segura en RLS

```sql
-- Ejemplo: Editar solo por OWNER y ADMIN de ese tenant
CREATE POLICY "customers_edit_by_role" ON customers
FOR UPDATE USING (
  tenant_id = auth.tenant_id()
  AND (
    (SELECT app_role FROM profiles WHERE id = auth.uid()) IN ('OWNER', 'ADMIN')
  )
);
```

### Verificación en Server Actions

```typescript
async function editCustomer(customerId: string, data: CustomerUpdate) {
  const supabase = createServerClient()
  const user = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('app_role')
    .eq('id', user.id)
    .single()

  if (!['OWNER', 'ADMIN'].includes(profile.app_role)) {
    throw new Error('Forbidden: Insufficient role permissions')
  }

  return supabase.from('customers').update(data).eq('id', customerId)
}
```

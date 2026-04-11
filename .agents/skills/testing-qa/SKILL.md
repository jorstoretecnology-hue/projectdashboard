---
name: testing-qa
description: >
  Testing, QA y aseguramiento de calidad para proyectos de software.
  Usar cuando el usuario quiera: escribir tests, debuggear errores,
  hacer QA manual, configurar testing automatizado, revisar bugs,
  hacer pruebas de regresión, testing de seguridad, o validar que
  el sistema funciona correctamente antes de lanzar.
  Activar con: test, bug, error, QA, calidad, debugging, prueba,
  regresión, validar, verificar, falla, crash, roto.
---

# Testing y QA

## Filosofía de testing

> "Testea lo que puede romperse en producción, no lo que ya probaste
> que funciona en desarrollo."

### Pirámide de testing para SaaS

```
        /\
       /  \      E2E Tests (pocos, caros, lentos)
      /    \     → Flujos críticos completos
     /------\
    /        \   Integration Tests (algunos)
   /          \  → API routes, Server Actions
  /------------\
 /              \ Unit Tests (muchos, baratos, rápidos)
/________________\ → Funciones puras, validaciones, utilidades
```

---

## Debugging sistemático

### Protocolo ante un bug

```
1. REPRODUCIR
   → ¿En qué entorno? (dev/staging/prod)
   → ¿Pasos exactos para reproducirlo?
   → ¿Siempre o intermitente?
   → ¿Qué usuario/tenant lo reporta?

2. AISLAR
   → ¿Frontend o backend?
   → ¿DB o lógica de aplicación?
   → ¿Qué cambió recientemente?
   → Revisar logs de Sentry

3. DIAGNOSTICAR
   → Agregar console.log temporales
   → Revisar Network tab en browser
   → Revisar Supabase logs
   → Reproducir en entorno limpio

4. CORREGIR
   → Fix mínimo que resuelve el problema
   → No refactorizar mientras se bugfixa

5. VERIFICAR
   → El bug ya no ocurre
   → No se rompió nada más
   → npx tsc --noEmit sin errores

6. DOCUMENTAR
   → Qué era el bug
   → Por qué ocurría
   → Cómo se resolvió
   → Cómo prevenirlo en el futuro
```

---

## Testing manual — QA de flujos

### Flujos críticos que deben verificarse antes de cada release

```markdown
## Checklist QA — Flujo de registro y onboarding
[ ] Usuario puede registrarse con email/password
[ ] Email de confirmación llega y el OTP funciona
[ ] Onboarding captura nombre del negocio e industria
[ ] Al completar onboarding, módulos se activan automáticamente
[ ] El módulo correcto por industria está activo (no todos, no ninguno)
[ ] Redirección a dashboard funciona tras onboarding

## Checklist QA — Flujo de ventas (POS)
[ ] POS abre correctamente
[ ] Búsqueda de productos funciona con debounce
[ ] Se puede agregar producto al carrito
[ ] Se puede modificar cantidad
[ ] Se puede procesar la venta
[ ] El stock se descuenta al confirmar
[ ] La venta aparece en el historial

## Checklist QA — Flujo de billing y upgrades
[ ] Página de billing muestra precio correcto para la industria del tenant
[ ] Botón de upgrade redirige a MercadoPago
[ ] Al volver de MercadoPago con éxito, el plan se actualiza
[ ] Los nuevos módulos se activan automáticamente tras el upgrade
[ ] El precio anual muestra el descuento correctamente

## Checklist QA — Seguridad
[ ] Sin sesión, redirige a login
[ ] Con sesión de tenant A, NO puede ver datos de tenant B
[ ] Usuario EMPLOYEE no puede acceder a /settings ni /billing
[ ] Usuario VIEWER no puede crear ni modificar datos
[ ] SuperAdmin puede ver todos los tenants desde /console
```

---

## Tests unitarios

### Funciones puras — siempre testear
```typescript
// src/lib/pricing.test.ts
import { formatCOP, yearlyDiscount } from './pricing'

describe('formatCOP', () => {
  it('formatea precio correctamente', () => {
    expect(formatCOP(99000)).toBe('$99.000')
    expect(formatCOP(1240000)).toBe('$1.240.000')
    expect(formatCOP(0)).toBe('$0')
  })
})

describe('yearlyDiscount', () => {
  it('calcula el ahorro anual', () => {
    // 99000 * 12 = 1.188.000. Si anual es 950.000, ahorra 238.000 (20%)
    const result = yearlyDiscount(99000, 950000)
    expect(result).toContain('238.000')
    expect(result).toContain('20%')
  })
})
```

### Validaciones Zod — testear casos edge
```typescript
// src/lib/schemas/products.test.ts
import { createProductSchema } from './products'

describe('createProductSchema', () => {
  it('acepta producto válido', () => {
    const result = createProductSchema.safeParse({
      name: 'Aceite de motor',
      price: 35000,
      stock: 10,
      category: 'repuestos',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza precio negativo', () => {
    const result = createProductSchema.safeParse({
      name: 'Producto',
      price: -100,
      stock: 0,
      category: 'general',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza nombre vacío', () => {
    const result = createProductSchema.safeParse({
      name: '',
      price: 1000,
      stock: 0,
      category: 'general',
    })
    expect(result.success).toBe(false)
  })
})
```

---

## Tests de integración — API Routes

```typescript
// src/app/api/v1/products/route.test.ts
describe('POST /api/v1/products', () => {
  it('crea producto para tenant autenticado', async () => {
    const response = await fetch('/api/v1/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        name: 'Aceite 20W50',
        price: 35000,
        stock: 50,
        category: 'lubricantes',
      }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.data.id).toBeDefined()
  })

  it('rechaza sin autenticación', async () => {
    const response = await fetch('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    })

    expect(response.status).toBe(401)
  })

  it('rechaza datos inválidos', async () => {
    const response = await fetch('/api/v1/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ name: '', price: -1 }),
    })

    expect(response.status).toBe(400)
  })
})
```

---

## Test de aislamiento entre tenants

```typescript
// test/security/tenant-isolation.test.ts
describe('Aislamiento entre tenants', () => {
  let tenantAClient: SupabaseClient
  let tenantBData: { customerId: string }

  beforeAll(async () => {
    // Login como usuario del Tenant A
    tenantAClient = createClient(SUPABASE_URL, ANON_KEY)
    await tenantAClient.auth.signInWithPassword({
      email: process.env.TEST_TENANT_A_EMAIL!,
      password: process.env.TEST_TENANT_A_PASSWORD!,
    })

    // ID conocido del Tenant B (para intentar acceder)
    tenantBData = { customerId: process.env.TEST_TENANT_B_CUSTOMER_ID! }
  })

  it('no puede leer clientes de otro tenant', async () => {
    const { data } = await tenantAClient
      .from('customers')
      .select('*')
      .eq('id', tenantBData.customerId)
      .single()

    expect(data).toBeNull()
  })

  it('no puede modificar datos de otro tenant', async () => {
    const { error } = await tenantAClient
      .from('customers')
      .update({ name: 'Hackeado' })
      .eq('id', tenantBData.customerId)

    expect(error).not.toBeNull()
  })
})
```

---

## Monitoreo en producción

### Sentry — configuración básica
```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% de transacciones
  beforeSend(event) {
    // No enviar errores de desarrollo
    if (process.env.NODE_ENV === 'development') return null
    return event
  },
})
```

### Qué monitorear
```
Errores críticos (alerta inmediata):
- Errores de autenticación en masa
- Fallas de pago
- Errores de DB en producción

Métricas de negocio:
- Conversión de free a paid
- Churn rate
- Módulos más usados por industria

Performance:
- Tiempo de carga de páginas principales
- Queries lentas en Supabase
```

---

## Regression testing antes de deploy

```bash
# Ejecutar antes de cada merge a main
npm run type-check          # TypeScript sin errores
npm run lint                # ESLint sin warnings críticos
npm run test                # Todos los tests pasan
npm run build               # Build exitoso

# Manual adicional
# [ ] Flujo de login funciona
# [ ] Flujo crítico del nicho principal funciona
# [ ] Billing page muestra precios correctos
```

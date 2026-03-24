# 🗺️ Roadmap de Implementación (IMPLEMENTATION_ROADMAP.md)

> Plan de ejecución secuencial para construir el Smart Business OS. Define el orden exacto de tareas, dependencias, criterios de éxito y tests de validación.

---

## 🎯 Filosofía de Implementación

### Principios
1. **Iterativo**: Cada fase produce algo funcional y verificable
2. **Validación Continua**: Testear antes de avanzar a la siguiente fase
3. **Fundación Primero**: Base de datos y seguridad antes que features
4. **MVP Funcional**: Al final de cada fase, algo debe funcionar end-to-end

### Stack Tecnológico Real
| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Backend** | Next.js API Routes + Server Actions |
| **Base de Datos** | Supabase (PostgreSQL + Auth + RLS) |
| **ORM / Queries** | Supabase Client (`@supabase/ssr`) |
| **Validación** | Zod |
| **Testing** | Vitest + Testing Library |
| **UI** | TailwindCSS + Radix UI + Lucide Icons |
| **Gráficas** | Recharts |
| **Email** | Resend |
| **Deploy** | Vercel |
| **Monitoreo** | Sentry |

---

## 📋 FASE 0: Setup y Actualización del Contexto (1 día)

### Objetivo
Tener el entorno actualizado, las herramientas verificadas y la documentación sincronizada.

### Tareas

#### 0.1 Actualizar MASTER_CONTEXT.md
```markdown
**Acción:** Integrar todos los documentos al índice maestro

**Documentos a agregar en nueva sección "4. Ejecución Técnica":**
- API_SPECIFICATION.md → "El Contrato de la API"
- DATABASE_SCHEMA.md → "El Esquema de Datos"
- DOMAIN_STATES.md → "Los Estados del Negocio"
- INTEGRATION_GUIDE.md → "Cómo Conectar Proveedores"
- SECURITY_CHECKLIST.md → "La Seguridad"
- IMPLEMENTATION_ROADMAP.md → "El Plan de Ejecución"

**Documentos a agregar en nueva sección "5. Operaciones":**
- TESTING_STRATEGY.md (futuro)
- DEPLOYMENT_PLAN.md (futuro)

**Criterio de éxito:** MASTER_CONTEXT.md tiene todas las secciones con links funcionales
```

#### 0.2 Verificar Entorno de Desarrollo
```bash
# Verificar versiones
node --version        # >= 18.x
npm --version         # >= 9.x
git --version

# Verificar Supabase CLI
npx supabase --version
npx supabase login
npx supabase status

# Verificar que el proyecto arranca
npm run dev           # Sin errores
npm run type-check    # Sin errores de TypeScript
npm run lint          # Sin warnings
npm run test          # Tests existentes pasan
```

**Criterio de éxito:** Todos los comandos ejecutan sin errores

#### 0.3 Verificar Variables de Entorno
```bash
# En .env.local deben existir:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Variables para DESPUÉS (Fase 7+):
# RESEND_API_KEY=
# META_WHATSAPP_ACCESS_TOKEN=
# META_WHATSAPP_PHONE_NUMBER_ID=
# SENTRY_DSN= (ya configurado)
```

**Criterio de éxito:** `npm run dev` inicia sin errores de variables faltantes

### ✅ Checklist de FASE 0
- [ ] MASTER_CONTEXT.md actualizado con todos los documentos
- [ ] Entorno verificado (Node, npm, Supabase CLI)
- [ ] Proyecto compila y arranca sin errores
- [ ] Variables de entorno configuradas

---

## 📊 FASE 1: Migración de Base de Datos (3-5 días)

### Objetivo
Tener el esquema completo de Supabase con RLS funcionando según `DATABASE_SCHEMA.md`.

### Tareas

#### 1.1 Migración de Tablas Existentes
```markdown
**Archivo:** supabase/migrations/01_update_existing_tables.sql

**Contenido:**
- ALTER TABLE products → agregar campos: state, threshold_low, threshold_critical,
  is_blocked, blocked_reason, blocked_at, blocked_by
- ALTER TABLE tenants → agregar settings JSONB para integraciones

**Comando:**
npx supabase migration new update_existing_tables
# Escribir SQL → npx supabase db push

**Test manual en SQL Editor de Supabase:**
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'products' AND column_name IN ('state', 'threshold_low', 'threshold_critical');
-- Debe retornar 3 filas

**Criterio de éxito:** Campos nuevos existen en Supabase Dashboard
```

#### 1.2 Crear Módulo de Ventas
```markdown
**Archivo:** supabase/migrations/02_create_sales_module.sql

**Tablas (según DATABASE_SCHEMA.md):**
- sales (tenant_id, customer_id, created_by, state, subtotal, tax, discount, total,
  payment_method, notes, override_reason, idempotency_key, timestamps)
- sale_items (sale_id, product_id, quantity, unit_price, subtotal)
- Índices: (tenant_id), (tenant_id, state), (tenant_id, created_at)
- RLS policies: tenant isolation + role-based access

**Test manual:**
-- Insertar venta de prueba
INSERT INTO sales (tenant_id, customer_id, created_by, state, subtotal, total)
VALUES ('test-tenant-id', 'test-customer-id', 'test-user-id', 'COTIZACIÓN', 100, 100);

-- Verificar RLS (debe retornar 0 filas si tenant_id no coincide con auth.jwt())
SELECT * FROM sales WHERE tenant_id = 'otro-tenant-id';

**Criterio de éxito:** Insertar y consultar funciona; RLS bloquea cross-tenant
```

#### 1.3 Crear Módulo de Compras
```markdown
**Archivo:** supabase/migrations/03_create_purchases_module.sql

**Tablas:**
- purchase_orders (tenant_id, supplier_name, state, expected_date, subtotal, total, notes)
- purchase_order_items (order_id, product_id, quantity_ordered, quantity_received, unit_cost)
- Índices y RLS policies

**Test:** Similar a 1.2 con cross-tenant validation
```

#### 1.4 Crear Módulo de Servicios (Taller)
```markdown
**Archivo:** supabase/migrations/04_create_services_module.sql

**Tablas:**
- vehicles (tenant_id, customer_id, brand, model, year, plate, vin, color, mileage)
- services (tenant_id, vehicle_id, customer_id, assigned_to, state, description,
  diagnosis, labor_cost, parts_cost, total_cost, priority, timestamps)

**Test especial de RLS por rol:**
-- Como EMPLOYEE, solo ver servicios asignados a mí
-- (Usar set_config para simular en SQL Editor)
SELECT set_config('request.jwt.claims', '{"sub":"employee-uuid","app_role":"EMPLOYEE"}', true);
SELECT * FROM services;
-- Solo debe retornar servicios donde assigned_to = 'employee-uuid'

**Criterio de éxito:** RLS diferenciado por rol funciona
```

#### 1.5 Sistema de Movimientos de Inventario
```markdown
**Archivo:** supabase/migrations/05_create_inventory_movements.sql

**Tabla:**
- inventory_movements (tenant_id, product_id, type, quantity, reference_type,
  reference_id, notes, created_by)
  type IN ('COMPRA', 'VENTA', 'AJUSTE_MANUAL', 'DEVOLUCIÓN', 'TRANSFERENCIA')

**Test:** Insertar movimiento y verificar que se registra correctamente
```

#### 1.6 Sistema de Eventos y Automatizaciones
```markdown
**Archivo:** supabase/migrations/06_create_automation_system.sql

**Tablas:**
- domain_events (tenant_id, event_type, entity_type, entity_id, payload, processed,
  processed_at, created_at)
- automation_templates (template_key, name, description, industry_type, trigger_event,
  trigger_condition, message_template, allowed_variables, default_channel, priority)
- tenant_automations (tenant_id, template_id, is_active, channel, config)
- automation_executions (tenant_id, automation_id, trigger_event_id, status, channel,
  recipient, message_sent, external_message_id, error_message, provider_response)

**IMPORTANTE:** Incluir seed data (tarea 1.9)
```

#### 1.7 Auditoría Avanzada
```markdown
**Archivo:** supabase/migrations/07_create_audit_tables.sql

**Tablas:**
- state_audit_log (tenant_id, entity_type, entity_id, old_state, new_state,
  changed_by, reason, metadata)
- permission_denials (tenant_id, user_id, action, resource, reason, ip_address)

**Nota:** La tabla audit_logs ya existe. Estas tablas complementan con tracking
de estados y denegaciones de permisos.
```

#### 1.8 Triggers y Funciones de PostgreSQL
```markdown
**Archivo:** supabase/migrations/08_create_triggers.sql

**Funciones (con search_path seguro):**
- update_product_state() → Recalcula state basado en stock vs thresholds
- emit_state_change_event() → Inserta en domain_events cuando cambia state
- update_updated_at_column() → Actualiza updated_at automáticamente
- prevent_negative_stock() → Bloquea transacciones que resultan en stock < 0

**Triggers:**
- products → BEFORE UPDATE → update_product_state()
- products → AFTER UPDATE OF state → emit_state_change_event()
- sales, services, purchase_orders → BEFORE UPDATE → update_updated_at_column()
- products → BEFORE UPDATE OF stock → prevent_negative_stock()

**Test CRÍTICO:**
-- Actualizar stock de producto
UPDATE products SET stock = 2 WHERE id = 'test-product-id';

-- Verificar que estado cambió automáticamente
SELECT state FROM products WHERE id = 'test-product-id';
-- Debe retornar 'CRÍTICO' si threshold_critical = 3

-- Verificar que evento se emitió
SELECT * FROM domain_events
WHERE entity_id = 'test-product-id'
AND event_type = 'products.state_changed';
-- Debe retornar 1 fila

**Criterio de éxito:** Trigger recalcula estado y emite evento automáticamente
```

#### 1.9 Seed Data: Templates de Automatización
```markdown
**Archivo:** supabase/migrations/09_seed_automation_templates.sql

**Templates iniciales:**
1. STOCK_CRITICAL_ALERT → "Producto {{producto_nombre}} en estado crítico ({{stock}} unidades)"
2. VEHICLE_READY → "Hola {{cliente_nombre}}, tu {{vehiculo_marca}} {{vehiculo_modelo}} está listo"
3. PAYMENT_REMINDER → "Recordatorio: Tienes un pago pendiente de ${{monto}}"
4. SALE_CANCELLED_NO_STOCK → "Tu pedido fue cancelado por falta de stock"
5. SERVICE_DELIVERED → "¡Gracias! Tu vehículo fue entregado. ¿Nos das tu opinión?"
6. APPOINTMENT_REMINDER → "Recuerda tu cita para {{servicio}} mañana a las {{hora}}"

**Test:**
SELECT COUNT(*) FROM automation_templates;
-- Debe retornar >= 6

**Criterio de éxito:** Templates insertados correctamente
```

### ✅ Checklist de FASE 1 Completada
- [ ] Todas las migraciones ejecutadas sin error
- [ ] RLS funciona (test de cross-tenant falla como debe)
- [ ] Triggers recalculan estados automáticamente
- [ ] prevent_negative_stock() bloquea stock < 0
- [ ] Templates de automatización existen (>= 6)
- [ ] Documentar cualquier desviación del plan

---

## 🔐 FASE 2: Seguridad y Middleware (2-3 días)

### Objetivo
Reforzar el sistema de autenticación existente e implementar las medidas de seguridad críticas del `SECURITY_CHECKLIST.md`.

### Tareas

#### 2.1 Reforzar Middleware de Next.js
```markdown
**Archivo:** src/middleware.ts (ya existe, mejorar)

**Mejoras:**
- Verificar JWT en cada request a rutas protegidas
- Extraer tenant_id del JWT claims y validar contra X-Tenant-ID header (redundancia)
- Rate limiting básico por IP (usando headers o edge middleware)
- Logging de accesos denegados

**Implementación:**
```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Verificar JWT
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isProtectedRoute(request.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Verificar tenant_id
  if (user) {
    const tenantId = user.app_metadata?.tenant_id;
    const headerTenantId = request.headers.get('X-Tenant-ID');
    if (headerTenantId && headerTenantId !== tenantId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN_CROSS_TENANT' } },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}
```

**Criterio de éxito:** Requests sin token son redirigidos; cross-tenant es bloqueado
```

#### 2.2 Crear Helpers de Autorización (RBAC)
```markdown
**Archivos nuevos:**
- src/lib/auth/roles.ts → Definición de roles y jerarquía
- src/lib/auth/guards.ts → Funciones para verificar permisos
- src/lib/auth/get-session.ts → Helper para obtener sesión en Server Components

**Implementación:**
```typescript
// src/lib/auth/guards.ts
import { z } from 'zod';

const RoleHierarchy = {
  SUPER_ADMIN: 5,
  OWNER: 4,
  ADMIN: 3,
  EMPLOYEE: 2,
  VIEWER: 1,
} as const;

export type AppRole = keyof typeof RoleHierarchy;

export function requireRole(userRole: AppRole, minimumRole: AppRole): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[minimumRole];
}

export function requireTenant(userTenantId: string, requestTenantId: string): boolean {
  return userTenantId === requestTenantId;
}
```

**Criterio de éxito:** Guards reutilizables en API Routes y Server Actions
```

#### 2.3 Proteger API Routes con Wrapper
```markdown
**Archivo nuevo:** src/lib/api/with-auth.ts

**Concepto:** HOF (Higher-Order Function) que envuelve API Route handlers
con autenticación, autorización, validación y manejo de errores.

```typescript
// src/lib/api/with-auth.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type AppRole, requireRole } from '@/lib/auth/guards';

interface AuthOptions {
  minimumRole: AppRole;
}

export function withAuth(handler: AuthenticatedHandler, options: AuthOptions) {
  return async (request: Request, context: any) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } },
        { status: 401 }
      );
    }

    const profile = await getProfile(supabase, user.id);
    if (!requireRole(profile.app_role, options.minimumRole)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Permisos insuficientes' } },
        { status: 403 }
      );
    }

    return handler(request, { user, profile, supabase, ...context });
  };
}
```

**Criterio de éxito:** Un solo wrapper reutilizable para todas las API Routes
```

#### 2.4 Validación de Input con Zod
```markdown
**Archivo nuevo:** src/lib/api/validate.ts

**Concepto:** Helper que parsea body/query con Zod y retorna error estandarizado.

```typescript
// src/lib/api/validate.ts
import { z, type ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

export async function validateBody<T>(request: Request, schema: ZodSchema<T>) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos inválidos en request',
            details: result.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}
```

**Criterio de éxito:** Inputs validados con mensajes claros
```

#### 2.5 Security Headers
```markdown
**Archivo:** next.config.ts (modificar)

**Agregar headers de seguridad:**
```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

**Criterio de éxito:** Headers presentes en todas las responses (verificar con DevTools)
```

#### 2.6 Tests de Seguridad
```markdown
**Archivo:** src/tests/security/security.test.ts

**Tests:**
1. SQL Injection: Enviar payload malicioso → debe retornar 400
2. XSS: Enviar <script> en name → debe sanitizarse
3. IDOR: Acceder a recurso de otro tenant → debe retornar 403
4. Auth bypass: Request sin token a ruta protegida → debe retornar 401
5. Role escalation: VIEWER intenta crear producto → debe retornar 403

**Criterio de éxito:** 5/5 tests pasan
```

### ✅ Checklist de FASE 2 Completada
- [ ] Middleware reforzado con validación de JWT y tenant
- [ ] Guards RBAC reutilizables creados
- [ ] `withAuth` wrapper funciona en API Routes
- [ ] Validación Zod implementada
- [ ] Security headers configurados
- [ ] Tests de seguridad pasan

---

## 📦 FASE 3: API — Módulo de Productos (4-5 días)

### Objetivo
Implementar el primer módulo completo (Productos) con TODOS sus endpoints como referencia para los demás módulos.

### Tareas

#### 3.1 Definir Schemas Zod
```markdown
**Archivos nuevos:**
- src/modules/products/schemas.ts

**Contenido:**
```typescript
// src/modules/products/schemas.ts
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  sku: z.string().optional(),
  category: z.string().optional(),
  threshold_low: z.number().int().nonnegative().default(10),
  threshold_critical: z.number().int().nonnegative().default(3),
  industry_type: z.enum(['general', 'taller', 'glamping', 'restaurante']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const QueryProductsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  state: z.enum(['DISPONIBLE', 'BAJO_STOCK', 'CRÍTICO', 'AGOTADO', 'BLOQUEADO']).optional(),
  category: z.string().optional(),
  sort_by: z.enum(['name', 'price', 'stock', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});
```

**Criterio de éxito:** Schemas exportados y tipados
```

#### 3.2 Implementar Service Layer
```markdown
**Archivo nuevo:** src/modules/products/service.ts

**Métodos (según API_SPECIFICATION.md):**
- list(query, tenantId) → Paginado con filtros
- findById(id, tenantId) → Producto con health score
- create(data, tenantId, userId) → Crear + registrar en audit
- update(id, data, tenantId) → Actualizar (trigger recalcula estado)
- delete(id, tenantId) → Soft delete o hard delete
- block(id, reason, tenantId, userId) → Bloquear con auditoría

**IMPORTANTE:** Cada método:
1. Usa Supabase Client (no SQL directo)
2. Filtra SIEMPRE por tenant_id (defensa en profundidad, RLS es backup)
3. Registra en audit_logs para acciones sensibles (block, delete)
4. Retorna en formato estándar { data, meta }

**Criterio de éxito:** Métodos implementados con lógica de negocio completa
```

#### 3.3 Implementar API Routes
```markdown
**Archivos nuevos (Next.js App Router):**
- src/app/api/v1/products/route.ts → GET (list) + POST (create)
- src/app/api/v1/products/[id]/route.ts → GET (detail) + PATCH (update) + DELETE
- src/app/api/v1/products/[id]/block/route.ts → POST (block/unblock)

**Ejemplo de implementación:**
```typescript
// src/app/api/v1/products/route.ts
import { withAuth } from '@/lib/api/with-auth';
import { validateBody } from '@/lib/api/validate';
import { ProductService } from '@/modules/products/service';
import { CreateProductSchema, QueryProductsSchema } from '@/modules/products/schemas';

export const GET = withAuth(async (req, { profile, supabase }) => {
  const url = new URL(req.url);
  const query = QueryProductsSchema.parse(Object.fromEntries(url.searchParams));
  const result = await ProductService.list(supabase, query, profile.tenant_id);
  return NextResponse.json({ data: result.data, meta: result.meta });
}, { minimumRole: 'VIEWER' });

export const POST = withAuth(async (req, { profile, supabase }) => {
  const { data, error } = await validateBody(req, CreateProductSchema);
  if (error) return error;
  const product = await ProductService.create(supabase, data, profile.tenant_id, profile.id);
  return NextResponse.json({ data: product }, { status: 201 });
}, { minimumRole: 'ADMIN' });
```

**Criterio de éxito:** Todos los endpoints responden según API_SPECIFICATION.md
```

#### 3.4 Tests Unitarios
```markdown
**Archivo:** src/modules/products/service.test.ts

**Tests clave:**
```typescript
describe('ProductService', () => {
  it('debe crear producto con tenant_id correcto', async () => { ... });
  it('debe filtrar siempre por tenant_id', async () => { ... });
  it('debe paginar resultados correctamente', async () => { ... });
  it('debe recalcular estado cuando stock cambia', async () => { ... });
  it('debe bloquear producto con auditoría', async () => { ... });
  it('debe rechazar precio negativo', async () => { ... });
});
```

**Criterio de éxito:** Tests pasan con >= 80% cobertura del service
```

#### 3.5 Tests de Integración (E2E de API)
```markdown
**Archivo:** src/tests/api/products.test.ts

**Tests:**
```typescript
describe('Products API (e2e)', () => {
  it('GET /api/v1/products retorna lista paginada', async () => { ... });
  it('POST /api/v1/products crea producto (ADMIN+)', async () => { ... });
  it('POST /api/v1/products rechaza VIEWER', async () => { ... });
  it('PATCH /api/v1/products/:id actualiza producto', async () => { ... });
  it('POST /api/v1/products/:id/block bloquea con razón', async () => { ... });
  it('GET /api/v1/products/:id retorna 403 para otro tenant', async () => { ... });
});
```

**Criterio de éxito:** Tests E2E pasan
```

### ✅ Checklist de FASE 3 Completada
- [ ] Schemas Zod definidos y validando
- [ ] Service layer completo con toda la lógica de negocio
- [ ] API Routes implementadas (GET, POST, PATCH, DELETE, block)
- [ ] Respuestas siguen formato estándar de API_SPECIFICATION.md
- [ ] Tests unitarios pasan (>= 80% cobertura)
- [ ] Tests E2E pasan
- [ ] Guards protegen por rol correctamente

---

## 👥 FASE 4: API — Módulo de Clientes (2-3 días)

### Objetivo
Implementar el CRUD de clientes, base necesaria para ventas y servicios.

### Tareas

#### 4.1 Schemas Zod + Service + API Routes
```markdown
**Archivos (mismo patrón que Fase 3):**
- src/modules/customers/schemas.ts
- src/modules/customers/service.ts (refactorizar el existente si aplica)
- src/app/api/v1/customers/route.ts → GET + POST
- src/app/api/v1/customers/[id]/route.ts → GET + PATCH + DELETE

**Endpoints según API_SPECIFICATION.md:**
- GET /api/v1/customers → Lista paginada con búsqueda
- POST /api/v1/customers → Crear cliente
- GET /api/v1/customers/:id → Detalle con historial de compras/servicios
- PATCH /api/v1/customers/:id → Actualizar
- DELETE /api/v1/customers/:id → Eliminar (verificar que no tenga ventas activas)

**Lógica especial:**
- Búsqueda por nombre, email o teléfono
- Detalle incluye conteo de ventas y servicios asociados
- No permitir eliminar si tiene ventas en estado != COMPLETADA/ANULADA
```

#### 4.2 Tests
```markdown
**Archivo:** src/modules/customers/service.test.ts

**Tests clave:**
- CRUD completo
- Búsqueda funciona
- No se puede eliminar cliente con ventas activas
- RLS aísla por tenant

**Criterio de éxito:** Tests pasan
```

### ✅ Checklist de FASE 4 Completada
- [ ] CRUD de clientes implementado
- [ ] Búsqueda por nombre/email/teléfono funciona
- [ ] Validación de eliminación (sin ventas activas)
- [ ] Tests pasan

---

## 🛒 FASE 5: API — Módulo de Ventas (5-6 días)

### Objetivo
Implementar el flujo completo de ventas según `BUSINESS_FLOWS.md` y `DOMAIN_STATES.md`.

### Tareas

#### 5.1 Schemas Zod
```markdown
**Archivo:** src/modules/sales/schemas.ts

**Schemas:**
- CreateSaleSchema (items[], customer_id, notes)
- ApproveSaleSchema
- ConfirmPaymentSchema (payment_method, amount_received)
- OverrideSaleSchema (reason: min 20 chars, items[])
```

#### 5.2 Service Layer con Transacciones
```markdown
**Archivo:** src/modules/sales/service.ts

**Métodos críticos:**
- createQuote() → Crear venta en estado COTIZACIÓN (verifica stock disponible)
- approve() → COTIZACIÓN → CONFIRMADA (reserva stock)
- confirmPayment() → CONFIRMADA → PAGADA → COMPLETADA
  * TRANSACCIÓN: Actualizar stock + registrar inventory_movement + emitir evento
- cancel() → Cualquier estado → ANULADA (liberar stock si estaba reservado)
- override() → Venta forzada sin stock (ADMIN+, con auditoría obligatoria)

**CRÍTICO: Transacción de pago:**
```typescript
// Usar supabase.rpc() para ejecutar función de PostgreSQL
// que haga todo en una sola transacción:
// 1. Actualizar sale.state → 'PAGADA'
// 2. UPDATE products SET stock = stock - quantity (para cada item)
// 3. INSERT INTO inventory_movements (tipo 'VENTA')
// 4. INSERT INTO domain_events (tipo 'sales.payment_confirmed')
// 5. Si stock < 0 → ROLLBACK (prevent_negative_stock trigger)
```

**Criterio de éxito:** Flujo completo funciona con consistencia de datos
```

#### 5.3 API Routes
```markdown
**Archivos:**
- src/app/api/v1/sales/route.ts → GET (list) + POST (create quote)
- src/app/api/v1/sales/[id]/route.ts → GET (detail)
- src/app/api/v1/sales/[id]/approve/route.ts → PATCH
- src/app/api/v1/sales/[id]/confirm-payment/route.ts → POST
- src/app/api/v1/sales/[id]/cancel/route.ts → PATCH
- src/app/api/v1/sales/override/route.ts → POST (ADMIN+, con audit)
```

#### 5.4 Test Crítico: Confirm Payment + Stock
```typescript
it('debe actualizar stock cuando se confirma el pago', async () => {
  // Crear producto con stock = 20
  const product = await createProduct({ stock: 20 });

  // Crear venta con quantity = 5
  const sale = await createSale({ items: [{ product_id: product.id, quantity: 5 }] });

  // Aprobar y pagar
  await approveSale(sale.id);
  await confirmPayment(sale.id, { payment_method: 'cash' });

  // Verificar stock actualizado
  const updatedProduct = await getProduct(product.id);
  expect(updatedProduct.stock).toBe(15); // 20 - 5

  // Verificar movimiento registrado
  const movements = await getInventoryMovements(product.id);
  expect(movements[0].type).toBe('VENTA');
  expect(movements[0].quantity).toBe(-5);
});
```

#### 5.5 Test Crítico: Race Condition
```typescript
it('debe manejar ventas concurrentes del último item', async () => {
  // Producto con stock = 1
  const product = await createProduct({ stock: 1 });

  // Dos ventas creadas
  const sale1 = await createSale({ items: [{ product_id: product.id, quantity: 1 }] });
  const sale2 = await createSale({ items: [{ product_id: product.id, quantity: 1 }] });

  // Aprobar ambas
  await approveSale(sale1.id);
  await approveSale(sale2.id);

  // Intentar pagar simultáneamente
  const [result1, result2] = await Promise.allSettled([
    confirmPayment(sale1.id),
    confirmPayment(sale2.id),
  ]);

  // Solo una debe tener éxito
  const successes = [result1, result2].filter(r => r.status === 'fulfilled');
  expect(successes.length).toBe(1);

  // La otra falla con NEGATIVE_STOCK_PREVENTED
  const failures = [result1, result2].filter(r => r.status === 'rejected');
  expect(failures[0].reason.code).toBe('NEGATIVE_STOCK_PREVENTED');
});
```

**Criterio de éxito:** Row-level locking previene stock negativo

### ✅ Checklist de FASE 5 Completada
- [ ] Flujo completo de venta funciona (cotización → pago → completada)
- [ ] Stock se actualiza en transacciones atómicas
- [ ] Inventory movements se registran
- [ ] Eventos se emiten a domain_events
- [ ] Override con auditoría funciona
- [ ] Race conditions manejadas (no stock negativo)
- [ ] Tests pasan

---

## 📋 FASE 6: API — Módulo de Compras (3-4 días)

### Objetivo
Implementar el flujo de órdenes de compra según `DOMAIN_STATES.md`.

### Tareas

#### 6.1 Schemas + Service + API Routes
```markdown
**Patrón idéntico a Ventas:**

**Flujo de estados:**
BORRADOR → ENVIADA → CONFIRMADA → EN_TRÁNSITO → RECIBIDA_PARCIAL → COMPLETADA
                                                       ↓
                                                  COMPLETADA (sin parcial)

**Endpoints:**
- GET /api/v1/purchases → Lista paginada
- POST /api/v1/purchases → Crear orden (BORRADOR)
- PATCH /api/v1/purchases/:id/send → Enviar a proveedor
- PATCH /api/v1/purchases/:id/confirm → Proveedor confirma
- POST /api/v1/purchases/:id/receive → Recibir mercancía
  * TRANSACCIÓN: Actualizar stock + registrar inventory_movement (tipo 'COMPRA')
  * Soportar recepción parcial (quantity_received < quantity_ordered)

**Test crítico:**
- Recibir mercancía → stock se incrementa
- Recepción parcial → estado = RECIBIDA_PARCIAL
- Recepción total → estado = COMPLETADA
```

### ✅ Checklist de FASE 6 Completada
- [ ] Flujo completo de compras funciona
- [ ] Recepción parcial implementada
- [ ] Stock se incrementa al recibir mercancía
- [ ] Inventory movements con tipo 'COMPRA'
- [ ] Tests pasan

---

## 🔧 FASE 7: API — Módulo de Servicios / Taller (4-5 días)

### Objetivo
Implementar el flujo específico de taller mecánico según `BUSINESS_FLOWS.md`.

### Tareas

#### 7.1 Schemas + Service + API Routes
```markdown
**Flujo de estados:**
RECIBIDO → DIAGNOSTICADO → COTIZADO → EN_REPARACIÓN → REPARADO → ENTREGADO
                                                                     ↓
                                                              GARANTÍA (si aplica)

**Endpoints:**
- POST /api/v1/vehicles → Registrar vehículo
- POST /api/v1/services → Recibir vehículo (RECIBIDO)
- PATCH /api/v1/services/:id/diagnose → Registrar diagnóstico
- PATCH /api/v1/services/:id/start-repair → Iniciar reparación
- PATCH /api/v1/services/:id/complete → Marcar como REPARADO
  * CRÍTICO: Dispara evento 'services.state_changed' { new_state: 'REPARADO' }
  * Este evento activa la automatización VEHICLE_READY (WhatsApp al cliente)
- PATCH /api/v1/services/:id/deliver → Entregar vehículo
```

#### 7.2 Test Crítico: Evento VEHICLE_READY
```typescript
it('debe emitir evento VEHICLE_READY cuando servicio se completa', async () => {
  const customer = await createCustomer({ phone: '+573001234567' });
  const vehicle = await createVehicle({ customer_id: customer.id });
  const service = await createService({ vehicle_id: vehicle.id });

  // Completar servicio
  await completeService(service.id, { diagnosis: 'Cambio de aceite completado' });

  // Verificar evento emitido
  const events = await getDomainEvents({
    entity_type: 'services',
    entity_id: service.id,
  });

  const vehicleReadyEvent = events.find(
    e => e.event_type === 'services.state_changed' &&
         e.payload.new_state === 'REPARADO'
  );

  expect(vehicleReadyEvent).toBeDefined();
  expect(vehicleReadyEvent.payload.customer_phone).toBe('+573001234567');
});
```

**Criterio de éxito:** Evento se emite con datos completos del cliente

### ✅ Checklist de FASE 7 Completada
- [ ] CRUD de vehículos funciona
- [ ] Flujo completo de servicios (recibido → entregado)
- [ ] Asignación de técnicos funciona
- [ ] Evento VEHICLE_READY se emite al completar servicio
- [ ] RLS diferencia EMPLOYEE vs ADMIN (empleado solo ve asignados)
- [ ] Tests pasan

---

## 📱 FASE 8: Integraciones — WhatsApp + Email (5-6 días)

### Objetivo
Conectar el Automation Engine con proveedores de comunicación reales.

### Sub-fase 8A: Arquitectura del Motor de Automatización (2 días)

#### 8A.1 Implementar Event Processor
```markdown
**Archivos nuevos:**
- src/modules/automations/event-processor.ts → Procesa domain_events pendientes
- src/modules/automations/automation-executor.ts → Ejecuta automatización
- src/modules/automations/providers/provider.interface.ts → Interfaz común
- src/modules/automations/providers/whatsapp-meta.provider.ts
- src/modules/automations/providers/resend-email.provider.ts
- src/modules/automations/providers/mock.provider.ts (para testing)

**Concepto: Cron vía Vercel Cron Jobs o API Route + Supabase pg_cron:**
```typescript
// src/app/api/cron/process-events/route.ts
// Vercel Cron: ejecuta cada 30 segundos
export async function GET(request: Request) {
  // 1. Verificar cron secret (seguridad)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Obtener eventos no procesados
  const events = await supabase
    .from('domain_events')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(50);

  // 3. Para cada evento, buscar automatizaciones activas
  for (const event of events.data) {
    const automations = await findActiveAutomations(event);
    for (const auto of automations) {
      await executeAutomation(auto, event);
    }
    // 4. Marcar como procesado
    await markAsProcessed(event.id);
  }

  return NextResponse.json({ processed: events.data.length });
}
```

**Configurar en vercel.json:**
```json
{
  "crons": [
    { "path": "/api/cron/process-events", "schedule": "* * * * *" }
  ]
}
```

**Criterio de éxito:** Eventos se procesan automáticamente
```

### Sub-fase 8B: WhatsApp (Meta) (2 días)

#### 8B.1 Configurar Meta Business Account
```markdown
**Pasos manuales (el desarrollador debe hacer):**
1. Ir a business.facebook.com
2. Crear Business Account
3. Agregar WhatsApp Product
4. Registrar número de teléfono (o usar sandbox mode para desarrollo)
5. Obtener Phone Number ID y Access Token
6. Crear Message Templates en Meta Dashboard
7. Agregar a .env.local:
   META_WHATSAPP_ACCESS_TOKEN=EAAG...
   META_WHATSAPP_PHONE_NUMBER_ID=1234567890
   META_WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210
   META_WEBHOOK_VERIFY_TOKEN=random_secure_string

**IMPORTANTE: Modo Sandbox para desarrollo**
Si no hay cuenta real disponible, usar mock.provider.ts que simula el envío.
```

#### 8B.2 Implementar WhatsApp Provider
```typescript
// src/modules/automations/providers/whatsapp-meta.provider.ts
export class WhatsAppMetaProvider implements CommunicationProvider {
  async send(payload: MessagePayload): Promise<ProviderResponse> {
    // Implementar según INTEGRATION_GUIDE.md Sección 2
    // 1. Construir body con template_name y parameters
    // 2. POST a https://graph.facebook.com/v21.0/{phoneNumberId}/messages
    // 3. Verificar respuesta
    // 4. Retornar { success, messageId, provider: 'whatsapp_meta' }
  }
}
```

#### 8B.3 Implementar Webhook de WhatsApp
```markdown
**Archivos:**
- src/app/api/v1/webhooks/whatsapp/route.ts → GET (verification) + POST (status updates)

**GET:** Verificar webhook con META_WEBHOOK_VERIFY_TOKEN
**POST:** Procesar status updates (delivered, read, failed)
  - Verificar firma HMAC-SHA256 (X-Hub-Signature-256)
  - Actualizar automation_executions.provider_response

**Criterio de éxito:** Webhook verifica y procesa status updates
```

### Sub-fase 8C: Email (Resend) (2 días)

#### 8C.1 Implementar Resend Provider
```markdown
**Dependencia:** resend ya está en package.json ✅

**Archivo:** src/modules/automations/providers/resend-email.provider.ts

```typescript
import { Resend } from 'resend';

export class ResendEmailProvider implements CommunicationProvider {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async send(payload: MessagePayload): Promise<ProviderResponse> {
    const { data, error } = await this.resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: payload.recipient_email,
      subject: payload.subject,
      html: renderTemplate(payload.template, payload.variables),
    });

    return {
      success: !error,
      messageId: data?.id,
      error: error?.message,
      provider: 'resend',
    };
  }
}
```

**Variables de entorno:**
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@yourdomain.com
RESEND_FROM_NAME=Smart Business OS

**Criterio de éxito:** Emails se envían correctamente
```

#### 8C.2 Webhook de Resend
```markdown
**Archivo:** src/app/api/v1/webhooks/resend/route.ts

**Eventos que procesar:**
- email.delivered → Actualizar estado
- email.bounced → Marcar como fallido
- email.complained → Marcar como spam, desactivar envíos futuros

**Verificar firma:** svix-signature header
```

### Sub-fase 8D: Test End-to-End

#### 8D.1 Test Completo: Vehículo Reparado → WhatsApp
```typescript
it('debe enviar WhatsApp cuando vehículo está listo', async () => {
  // Setup
  const customer = await createCustomer({ phone: '+573001234567' });
  const vehicle = await createVehicle({ customer_id: customer.id });
  const service = await createService({ vehicle_id: vehicle.id });

  // Activar automatización VEHICLE_READY
  await activateAutomation('VEHICLE_READY', 'whatsapp');

  // Completar servicio → emite evento
  await completeService(service.id);

  // Procesar eventos manualmente (en test, no esperar cron)
  await processEvents();

  // Verificar ejecución
  const executions = await getAutomationExecutions();
  const vehicleReadyExec = executions.find(
    e => e.automation.template.template_key === 'VEHICLE_READY'
  );

  expect(vehicleReadyExec.status).toBe('SUCCESS');
  expect(vehicleReadyExec.recipient).toBe('+573001234567');
  expect(vehicleReadyExec.channel).toBe('whatsapp');
});
```

### ✅ Checklist de FASE 8 Completada
- [ ] Event processor procesa domain_events automáticamente
- [ ] WhatsApp provider envía mensajes (o mock funciona)
- [ ] Webhook de WhatsApp verifica firma y procesa status
- [ ] Resend provider envía emails
- [ ] Webhook de Resend procesa bounces/complaints
- [ ] Mock provider funciona para development/testing
- [ ] Test E2E: servicio completado → mensaje enviado
- [ ] Idempotencia: mismo evento no se procesa dos veces

---

## 🎨 FASE 9: Frontend — Dashboard y Módulos (7-10 días)

### Objetivo
Conectar la UI existente a la API real y crear las interfaces faltantes.

### Sub-fase 9A: Dashboard Principal (2-3 días)

#### 9A.1 Dashboard con Datos Reales
```markdown
**Archivo:** src/app/(app)/dashboard/page.tsx (ya existe, adaptar)

**Conectar a API real:**
- Health Score general del negocio (basado en estados de productos)
- KPIs: Ventas del mes, Servicios activos, Productos en stock crítico
- Gráfico de ventas (Recharts, ya instalado)
- Alertas activas (productos críticos, servicios sin diagnóstico > 72h)
- Últimas 5 ventas y servicios

**Usar Server Components + fetch a API Routes propias**
```

### Sub-fase 9B: Módulo de Productos UI (2 días)

#### 9B.1 Interfaz de Productos
```markdown
**Archivos:**
- src/app/(app)/products/page.tsx → Lista con tabla, filtros, búsqueda
- src/components/products/ProductTable.tsx → Tabla con paginación
- src/components/products/ProductForm.tsx → Modal crear/editar
- src/components/products/ProductStateBadge.tsx → Badge de color por estado
- src/components/products/StockAlert.tsx → Alerta visual de stock

**Features:**
- Tabla con ordenamiento y filtros
- Badge de estado: 🟢 DISPONIBLE, 🟡 BAJO_STOCK, 🟠 CRÍTICO, 🔴 AGOTADO, ⛔ BLOQUEADO
- Formulario dinámico según industry_type (taller: marca, modelo, año)
- Acción de bloqueo con diálogo de confirmación y razón
```

### Sub-fase 9C: Módulo de Ventas UI (2-3 días)

#### 9C.1 Interfaz de Ventas
```markdown
**Archivos:**
- src/app/(app)/sales/page.tsx → Lista de ventas con estados
- src/components/sales/SaleWizard.tsx → Wizard paso a paso para crear venta
- src/components/sales/SaleStateBadge.tsx → Badge por estado
- src/components/sales/PaymentDialog.tsx → Modal de confirmación de pago

**Wizard de Venta:**
1. Seleccionar cliente (dropdown con búsqueda)
2. Agregar productos (tabla con cantidad y subtotal en tiempo real)
3. Revisar totales (subtotal, impuestos, descuento, total)
4. Confirmar cotización o pago directo
```

### Sub-fase 9D: Módulo de Servicios UI (2 días)

#### 9D.1 Interfaz de Servicios (Taller)
```markdown
**Archivos:**
- src/app/(app)/services/page.tsx → Kanban o lista de servicios
- src/components/services/ServiceKanban.tsx → Vista kanban por estado
- src/components/services/ServiceForm.tsx → Formulario de recepción
- src/components/services/VehicleSelector.tsx → Buscar/crear vehículo

**Vista Kanban:** Columnas RECIBIDO | DIAGNOSTICADO | EN_REPARACIÓN | REPARADO | ENTREGADO
```

### ✅ Checklist de FASE 9 Completada
- [ ] Dashboard conectado a datos reales con KPIs
- [ ] Módulo de productos completo (tabla, CRUD, estados visuales)
- [ ] Módulo de ventas con wizard de creación
- [ ] Módulo de servicios con vista kanban
- [ ] UI respeta roles (botones ocultos si no tiene permiso)
- [ ] Responsive en mobile y desktop
- [ ] Tests de componentes con Testing Library

---

## 🚀 FASE 10: CI/CD y Deploy a Staging (2-3 días)

### Objetivo
Pipeline de CI automatizado y deploy a ambiente de pruebas.

### Tareas

#### 10.1 Configurar GitHub Actions
```markdown
**Archivo nuevo:** .github/workflows/ci.yml

**Pipeline:**
1. Checkout
2. Setup Node 18
3. npm ci
4. npm run type-check → TypeScript sin errores
5. npm run lint → ESLint sin warnings
6. npm run test → Vitest pasa
7. npm run build → Build de producción exitoso

**Triggers:** push a main, pull requests
```

#### 10.2 Deploy a Vercel
```markdown
**Pasos:**
1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Configurar dominio (staging.smartbusiness.com)
4. Configurar Vercel Cron Jobs para event processor
5. Verificar deploy automático en push a main

**Smoke tests post-deploy:**
- [ ] / → Login page carga
- [ ] /login → Auth funciona
- [ ] /dashboard → KPIs se muestran
- [ ] /api/v1/products → API responde
- [ ] Cron job ejecuta (verificar en Vercel logs)
```

#### 10.3 Configurar Sentry en Producción
```markdown
**Ya instalado:** @sentry/nextjs ✅

**Configurar:**
- SENTRY_DSN en Vercel env vars
- Source maps uploaded en build
- Error boundaries en componentes críticos
```

### ✅ Checklist de FASE 10 Completada
- [ ] CI pipeline pasa en GitHub Actions
- [ ] Deploy automático a Vercel funciona
- [ ] Variables de entorno configuradas en Vercel
- [ ] Cron jobs configurados y ejecutando
- [ ] Sentry captura errores
- [ ] Smoke tests pasan en staging

---

## ✅ Criterios de Éxito del MVP Completo

Al terminar todas las fases:

### Funcional
- [ ] Crear productos y ver su estado (DISPONIBLE → CRÍTICO → AGOTADO)
- [ ] Crear venta → stock se actualiza automáticamente
- [ ] Crear servicio (taller) → marcar REPARADO → mensaje WhatsApp se envía
- [ ] Crear orden de compra → recibir mercancía → stock se incrementa
- [ ] Audit log registra overrides y acciones sensibles
- [ ] RLS previene cross-tenant access en todas las tablas

### Técnico
- [ ] Todas las migraciones aplicadas en Supabase
- [ ] API responde según API_SPECIFICATION.md
- [ ] Frontend conectado a API real (no mock data)
- [ ] WhatsApp y/o Email envían mensajes reales
- [ ] Tests unitarios y E2E pasan
- [ ] CI/CD pipeline funciona

### Seguridad
- [ ] Middleware protege rutas con JWT
- [ ] RBAC guards verifican roles en API Routes
- [ ] RLS activo en todas las tablas nuevas
- [ ] Validación Zod en todos los inputs
- [ ] Security headers configurados
- [ ] Rate limiting activo (al menos en login)
- [ ] Logs sanitizados (no PII expuesta)

---

## 📊 Resumen de Estimación

| Fase | Nombre | Estimado | Dependencias |
|------|--------|----------|--------------|
| 0 | Setup y Contexto | 1 día | — |
| 1 | Base de Datos | 3-5 días | Fase 0 |
| 2 | Seguridad y Middleware | 2-3 días | Fase 1 |
| 3 | API: Productos | 4-5 días | Fase 2 |
| 4 | API: Clientes | 2-3 días | Fase 2 |
| 5 | API: Ventas | 5-6 días | Fases 3, 4 |
| 6 | API: Compras | 3-4 días | Fase 3 |
| 7 | API: Servicios | 4-5 días | Fase 4 |
| 8 | Integraciones | 5-6 días | Fases 5, 7 |
| 9 | Frontend | 7-10 días | Fases 3-7 |
| 10 | CI/CD y Deploy | 2-3 días | Fase 9 |
| | **TOTAL** | **~38-52 días** | **~8-11 semanas** |

> **Nota:** Las Fases 3-4 y 6-7 pueden paralelizarse si hay más de un desarrollador, reduciendo el tiempo total a ~6-8 semanas.

---

## 📝 Plantilla de Reporte por Fase

Después de completar cada fase, documentar:

```markdown
## Fase X Completada - [Fecha]

### ✅ Tareas Completadas
- [x] Tarea 1
- [x] Tarea 2

### ⚠️ Desviaciones del Plan
- Cambio A: [Descripción y justificación]
- Cambio B: [Descripción y justificación]

### 🐛 Issues Encontrados
- Issue 1: [Descripción y cómo se resolvió]

### 📊 Métricas
- Tests pasando: X/Y
- Cobertura de código: Z%
- Tiempo invertido: N días

### ➡️ Siguiente Paso
Fase [X+1]: [Nombre]
```

---

**Estado**: ✅ **Roadmap de Implementación Completo**
**Versión**: 2.0.0
**Última Actualización**: 2026-02-13
**Stack**: Next.js 16 + Supabase + Zod + Vitest + TailwindCSS
**Próximo Paso**: Ejecutar Fase 0

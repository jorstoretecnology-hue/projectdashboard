# 🏗️ Antigravity Architecture Rules

## Estructura del Proyecto

### Directorios Principales

```
E:\ProyectDashboard\
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Componentes reutilizables
│   ├── core/                # Lógica core del negocio
│   │   ├── modules/         # Sistema de módulos
│   │   └── security/        # Seguridad y auditoría
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilidades y configuración
│   │   └── supabase/        # Cliente y tipos de Supabase
│   ├── providers/           # Context providers
│   └── types/               # Tipos TypeScript globales
├── supabase/
│   ├── migrations/          # Migraciones SQL
│   └── functions/           # Edge Functions
├── docs/
│   ├── ai-coordination/     # Coordinación de agentes IA
│   ├── security/            # Documentación de seguridad
│   └── technical/           # Documentación técnica
└── scripts/                 # Scripts de utilidad
```

---

## Sistema Multi-Tenant

### Reglas de Aislamiento

1. **Cada tenant tiene:**
   - UUID único en `tenants.id`
   - Suscripción activa en `subscriptions`
   - Módulos configurados en `tenant_modules`
   - Sedes en `locations`

2. **Cada usuario pertenece a:**
   - Un tenant principal (`profiles.tenant_id`)
   - Una o más sedes (`user_locations`)
   - Un rol por sede (`OWNER`, `ADMIN`, `EMPLOYEE`, `VIEWER`)

3. **Aislamiento de datos:**
   - Todas las tablas operativas tienen `tenant_id`
   - RLS filtra por `get_current_user_tenant_id()`
   - Prohibido cruzar datos entre tenants

---

## Sistema de Módulos

### Módulos Disponibles

| Módulo | Slug | Tipo | Descripción |
|--------|------|------|-------------|
| Dashboard | `dashboard` | Core | Panel principal |
| Inventario | `inventory` | Core | Gestión de productos |
| Clientes | `customers` | Core | CRM |
| Ventas | `sales` | Core | Punto de venta |
| Compras | `purchases` | Standard | Órdenes de compra |
| Órdenes de Trabajo | `work_orders` | Taller | Servicios |
| Vehículos | `vehicles` | Taller | Registro vehículos |
| Reservas | `reservations` | Restaurante/Gym | Agenda |
| Membresías | `memberships` | Gym | Planes recurrentes |
| Reportes | `reports` | Standard | Analytics |
| Facturación | `billing` | Core | Suscripciones |
| Usuarios | `users` | Standard | Gestión de usuarios |
| Configuración | `settings` | Core | Ajustes |

### Activación de Módulos

```typescript
// ✅ CORRECTO - Usar ModuleContext
const { isModuleActive, activeModuleSlugs } = useModuleContext()

if (isModuleActive('work_orders')) {
  // Mostrar menú de órdenes de trabajo
}

// ❌ PROHIBIDO - Hardcodear módulos
const modules = ['dashboard', 'inventory'] // Usar contexto
```

### Module Registry

Archivo: `src/core/modules/module-registry.ts`

```typescript
export interface ActiveModule {
  key: string
  status: 'ACTIVE' | 'INACTIVE' | 'RESTRICTED' | 'DORMANT' | 'ERROR'
  permissions: string[]
  navigation?: { label: string; path: string; icon?: string }[]
}
```

---

## Sistema de Sedes (Locations)

### Jerarquía

```
Tenant
├── Location (Sede Principal)
│   ├── Users (con roles)
│   ├── Inventory
│   ├── Sales
│   └── Services
├── Location (Sede Secundaria 1)
└── Location (Sede Secundaria 2)
```

### Hook useLocation

Archivo: `src/hooks/useLocation.ts`

```typescript
const {
  locations,           // Todas las sedes accesibles
  currentLocation,     // Sede activa
  currentRole,         // Rol del usuario en sede activa
  switchLocation,      // Cambiar sede
  canWriteHere,        // Verificar permisos de escritura
  canReadSiblings,     // Ver sedes hermanas
  isAdmin,             // Es OWNER o ADMIN
} = useLocation()
```

### Reglas de Permisos por Rol

| Rol | Lectura | Escritura | Gestionar Usuarios |
|-----|---------|-----------|-------------------|
| OWNER | Todas las sedes | Todas las sedes | ✅ |
| ADMIN | Sede actual + hermanas* | Sede actual | ✅ |
| EMPLOYEE | Sede actual | Recursos asignados | ❌ |
| VIEWER | Sede actual | ❌ | ❌ |

*Si `can_read_sibling_locations = true`

---

## Planes y Suscripciones

### Planes Disponibles

| Plan | Slug | Precio | Locations | Users | Módulos Incluidos |
|------|------|--------|-----------|-------|-------------------|
| Gratuito | `free` | $0 | 1 | 1 | dashboard, inventory, settings, billing |
| Starter | `starter` | $49K/mes | 1 | 3 | + customers, sales |
| Profesional | `professional` | $129K/mes | 3 | 10 | + purchases, work_orders, vehicles, users |
| Empresa | `enterprise` | $299K/mes | ∞ | ∞ | Todos los módulos |

### Tablas Relacionadas

- `plans` - Catálogo de planes
- `subscriptions` - Suscripción activa por tenant
- `payments` - Historial de pagos

---

## Middleware de Autenticación

Archivo: `src/middleware.ts`

### Flujo

```
1. Verificar si ruta es pública
   ├─ SÍ → Permitir acceso
   └─ NO → Continuar

2. Verificar sesión con Supabase
   ├─ Sin sesión → Redirigir a /auth/login
   └─ Con sesión → Continuar

3. Verificar ruta Super Admin
   ├─ Es Super Admin → Permitir
   └─ No es → Redirigir a /dashboard

4. Verificar ruta protegida
   ├─ Tiene tenant → Permitir
   └─ Sin tenant → Redirigir a /onboarding
```

---

## Context Providers

### AuthContext
- Estado de autenticación
- Usuario actual
- Rol y permisos

### ModuleContext
- Módulos activos del tenant
- Permisos por módulo
- Navegación disponible

### TenantContext
- Información del tenant
- Sede principal
- Configuración global

---

## Patrones de Diseño

### Repository Pattern (Core)

```typescript
// src/core/customers/customer.repository.ts
export class CustomerRepository {
  async findByTenant(tenantId: string) {
    // RLS automático vía Supabase
    return supabase
      .from('customers')
      .select('id, name, email')
      .eq('tenant_id', tenantId)
  }
}
```

### Service Layer

```typescript
// src/core/customers/customer.service.ts
export class CustomerService {
  constructor(private repo: CustomerRepository) {}
  
  async createCustomer(data: CustomerCreateInput) {
    // Validación Zod
    const validated = customerSchema.parse(data)
    
    // Lógica de negocio
    // ...
    
    // Persistencia
    return this.repo.create(validated)
  }
}
```

### Hooks Custom

```typescript
// src/hooks/useCustomers.ts
export function useCustomers() {
  const { user } = useUser()
  const [customers, setCustomers] = useState([])
  
  useEffect(() => {
    if (!user?.id) return
    // Cargar clientes
  }, [user?.id])
  
  return { customers, loading, error }
}
```

---

## Convenciones de Nomenclatura

### Archivos
- Componentes: `PascalCase.tsx` → `CustomerForm.tsx`
- Hooks: `camelCase.ts` → `useCustomers.ts`
- Utilidades: `camelCase.ts` → `formatCurrency.ts`
- Tipos: `PascalCase.ts` → `customer.types.ts`

### Funciones y Variables
- Funciones: `camelCase` → `getCustomerById`
- Componentes: `PascalCase` → `CustomerList`
- Constantes: `UPPER_SNAKE_CASE` → `MAX_CUSTOMERS`
- Types/Interfaces: `PascalCase` → `CustomerInput`

### Clases CSS (Tailwind)
- Orden: layout → box → typography → visual → interactive
- Usar `cn()` para conditional classes

---

## Referencias

- [CONTEXTO_DEL_PROYECTO.md](../../docs/CONTEXTO_DEL_PROYECTO.md)
- [ARCHITECTURE_SUMMARY.md](../../ARCHITECTURE_SUMMARY.md)
- [PROMPT_ANTIGRAVITY.md](./PROMPT_ANTIGRAVITY.md)

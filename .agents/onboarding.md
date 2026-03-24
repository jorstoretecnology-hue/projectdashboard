---
trigger: on_session_start
glob: "**/*"
description: Protocolo de inicio de sesión - Leer primero para entender el estado del proyecto
---

# 🚀 Onboarding Rápido

> **Versión**: 5.0.0
> **Última actualización**: 22 de marzo de 2026
> **Estado**: ✅ Actualizado para Dashboard Universal SaaS

Este workflow define qué hacer **AL INICIO** de cada sesión de trabajo con el proyecto Dashboard Universal SaaS.

---

## Paso 1: Leer el estado actual (5 min)

Lee `docs/PROGRESS_TRACKER.md` — contiene:
- ✅ Qué se hizo en la última sesión
- ✅ Cuál es el próximo paso concreto
- ✅ Qué fase del roadmap está activa
- ✅ Inventario de lo que existe vs lo que falta
- ✅ Decisiones técnicas que ya fueron tomadas

---

## Paso 2: Entender la arquitectura si es necesario (10 min)

Si necesitas contexto más profundo, lee en este orden:

1. **`RULES_MASTER_GUIDE.md`** (raíz) → Guía maestra de reglas
2. **`ARCHITECTURE_SUMMARY.md`** (raíz) → Arquitectura y contexto técnico
3. **`docs/CONTEXTO_DEL_PROYECTO.md`** → Contexto del negocio y elevator pitch
4. **`docs/technical/MODULE_BLUEPRINT.md`** → Patrón para crear módulos nuevos
5. El documento específico que necesites según la tarea:
   - ¿Security? → `docs/security/SECURITY_QUICK_REFERENCE.md`
   - ¿Database? → `docs/technical/DATABASE_SCHEMA.md`
   - ¿API? → `docs/technical/API_SPECIFICATION.md`
   - ¿Permisos? → `docs/technical/PERMISSIONS_MATRIX.md`

---

## Paso 3: Al finalizar la sesión SIEMPRE (5 min)

### 1. Actualizar `docs/PROGRESS_TRACKER.md`:
- [ ] Sección "🔄 Última Actualización" (fecha, qué se hizo, próximo paso)
- [ ] Tabla "Estado del Roadmap" si alguna fase cambió
- [ ] "Inventario Técnico" si se crearon archivos/tablas nuevas

### 2. Actualizar `CHANGELOG.md` si aplica

### 3. Hacer commit descriptivo:
```bash
git add .
git commit -m "feat: descripción del cambio"
# o
git commit -m "fix: descripción del bug fix"
```

### 4. Actualizar documentación si hubo cambios arquitectónicos

---

## 📚 Documentación Esencial por Contexto

### Si Vas a Desarrollar una Feature Nueva
1. `docs/technical/MODULE_BLUEPRINT.md` - Patrón a seguir
2. `docs/technical/DATABASE_SCHEMA.md` - Estructura de DB
3. `docs/technical/PERMISSIONS_MATRIX.md` - Permisos necesarios

### Si Vas a Arreglar un Bug
1. `docs/security/SECURITY_CHECKLIST.md` - Verificar si es tema de seguridad
2. `docs/technical/BUSINESS_FLOWS.md` - Entender el flujo afectado
3. `docs/TROUBLESHOOTING.md` - Ver si el error ya está documentado

### Si Vas a Escribir Tests
1. `docs/testing/USER_FLOW_TESTING.md` - Estándares de testing
2. [Vitest docs](https://vitest.dev) - Framework que usamos

### Si Vas a Tocar Autenticación/Permisos
1. `docs/security/SECURITY_CHECKLIST.md` - **CRÍTICO**
2. `docs/technical/PERMISSIONS_MATRIX.md` - Matriz de roles
3. `ARCHITECTURE_SUMMARY.md` - Reglas de RLS

---

## 🔐 Reglas Inmutables

### Stack Tecnológico
| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | Next.js | 16 (App Router + Turbopack) |
| Lenguaje | TypeScript | 5.3 (estricto) |
| Backend | Supabase | PostgreSQL + Auth + RLS |
| UI | TailwindCSS + Shadcn/UI | Latest |
| Validación | Zod | Latest |
| Testing | Vitest + RTL | 1.2+ |
| Auth | Supabase Auth | Email + Google OAuth |
| Emails | Resend | Latest |
| Rate Limiting | Upstash Redis | Latest |
| Monitoreo | Sentry | Latest |

### Reglas de Negocio
- **Idioma UI**: Español (Colombia)
- **Multi-tenant**: TODO debe filtrar por `tenant_id`
- **Roles**: Usar `app_role` (`SUPER_ADMIN`, `OWNER`, `ADMIN`, `EMPLOYEE`, `VIEWER`)
- **Validación**: Zod (NO class-validator, NO Yup)
- **API**: Next.js API Routes bajo `/api/v1/` (NO NestJS)
- **RLS**: Obligatorio en TODAS las queries
- **Select**: Prohibido `select('*')`, usar campos explícitos
- **TypeScript**: Prohibido `any`, usar tipos o `unknown`
- **Logging**: Usar `logger.ts`, NO `console.log` en producción

### Sistema de Módulos
| Módulo | Slug | Tipo | Estado |
|--------|------|------|--------|
| Dashboard | `dashboard` | Core | ✅ Activo |
| Inventario | `inventory` | Core | ✅ Activo |
| Clientes | `customers` | Core | ✅ Activo |
| Ventas | `sales` | Core | ✅ Activo |
| Compras | `purchases` | Standard | ✅ Activo |
| Órdenes de Trabajo | `work_orders` | Taller | ✅ Activo |
| Vehículos | `vehicles` | Taller | ✅ Activo |
| Reservas | `reservations` | Restaurante/Gym | 🚧 Pendiente |
| Membresías | `memberships` | Gym | 🚧 Pendiente |
| Reportes | `reports` | Standard | 🚧 Pendiente |
| Facturación | `billing` | Core | ✅ Activo |
| Usuarios | `users` | Standard | ✅ Activo |
| Configuración | `settings` | Core | ✅ Activo |

---

## 🚨 Errores Comunes de IAs Nuevas

### ❌ Error 1: Saltarse la Documentación
```
IA: "Voy a crear un componente de customers"
❌ Crea `src/components/CustomerForm.tsx` desde cero
✅ Debío usar `src/modules/customers/actions.ts` como guía
```
**Lección:** Siempre busca si ya existe un patrón establecido.

### ❌ Error 2: Ignorar RLS
```typescript
// ❌ MAL: Query sin filtro de tenant
const { data } = await supabase.from('customers').select('*')

// ✅ BIEN: Query con RLS
const tenantId = await getRequiredTenantId()
const { data } = await supabase
  .from('customers')
  .select('id, first_name, email')
  .eq('tenant_id', tenantId)
```
**Lección:** Multi-tenancy NO es negociable.

### ❌ Error 3: Usar `any` en TypeScript
```typescript
// ❌ MAL
function createCustomer(data: any) {}

// ✅ BIEN
interface CreateCustomerDTO {
  first_name: string
  last_name: string
  email: string
}
function createCustomer(data: CreateCustomerDTO) {}
```
**Lección:** 64 `any` ya existen, no agregues más.

### ❌ Error 4: Fetch en useEffect
```typescript
// ❌ MAL: Cliente haciendo fetch
export function CustomersPage() {
  const [data, setData] = useState()
  useEffect(() => {
    fetch('/api/customers').then(setData)
  }, [])
}

// ✅ BIEN: Server Component
export default async function CustomersPage() {
  const data = await db.query('SELECT * FROM customers')
  return <CustomersClient data={data} />
}
```
**Lección:** App Router = Server Components para fetch.

---

## 🛠️ Comandos Útiles

### Desarrollo
```bash
npm run dev              # Servidor con Turbopack
npm run build            # Build de producción
npm run start            # Servidor de producción
```

### Calidad de Código
```bash
npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run lint:fix         # Auto-fix ESLint
npm run format           # Prettier write
npm run format:check     # Prettier check
```

### Testing
```bash
npm test                 # Vitest run
npm run test:watch       # Vitest watch
npm run test:coverage    # Vitest con coverage
```

### Verificación Completa
```bash
npm run check            # type-check + lint + test (paralelo)
```

### Auditoría
```bash
npm run security:audit   # Genera reporte MD + JSON
npm run security:validate # Valida umbrales críticos
```

### Herramientas de Análisis
```bash
npx ts-prune             # Detectar código muerto TypeScript
npx knip                 # Detectar imports no usados
npm audit                # Vulnerabilidades de dependencias
```

---

## 📞 Contacto y Soporte

### Canales de Comunicación
- **GitHub Issues:** Bugs y feature requests
- **Slack Antigravity:** Canal #dashboard-universal
- **Email:** soporte@antigravity.com

### Horarios de Soporte
- **Lunes a Viernes:** 9:00 AM - 6:00 PM (Bogotá)
- **Sábados:** 9:00 AM - 1:00 PM (Bogotá)
- **Emergencias:** 24/7 vía Slack

---

## ✅ Checklist de Inicio de Sesión

```
[ ] Leí docs/PROGRESS_TRACKER.md
[ ] Entiendo cuál es mi tarea inmediata
[ ] Consulté la documentación específica si es necesario
[ ] Sé cuál es el criterio de éxito
```

## ✅ Checklist de Fin de Sesión

```
[ ] Actualicé docs/PROGRESS_TRACKER.md
[ ] Actualicé CHANGELOG.md (si aplica)
[ ] Hice commit descriptivo
[ ] Actualicé documentación (si hubo cambios arquitectónicos)
[ ] Dejé el código en estado compilable
```

---

**¡Bienvenido al equipo! 🚀**

*Si tienes dudas, recuerda: la documentación es tu mejor amiga.*

---

**Última actualización**: 22 de marzo de 2026
**Versión**: 5.0.0
**Mantenedor**: Equipo de Desarrollo + IAs de Antigravity

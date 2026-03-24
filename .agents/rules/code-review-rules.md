---
trigger: on_pull_request
glob: "**/*.{ts,tsx,js,jsx,sql}"
description: Reglas para Code Review y Pull Requests
---

# 🔍 Reglas para Code Review y Pull Requests

## Checklist de Code Review

### 1. Seguridad (CRÍTICO)

#### Autenticación y Autorización
- [ ] Verifica autenticación en API routes y Server Actions
- [ ] Valida permisos por rol (SUPER_ADMIN, OWNER, ADMIN, etc.)
- [ ] Protege rutas de SuperAdmin (`/superadmin/*`)
- [ ] Verifica `tenant_id` en todas las queries

#### Row Level Security (RLS)
- [ ] Todas las queries incluyen `.eq('tenant_id', ...)`
- [ ] No usa `bypassRLS(true)` sin justificación explícita
- [ ] Nuevas tablas tienen políticas RLS definidas
- [ ] Tests de cross-tenant access incluidos

#### Validación de Inputs
- [ ] Schema Zod definido para todos los inputs
- [ ] `zod.safeParse()` o `zod.parse()` antes de procesar
- [ ] Mensajes de error personalizados en validaciones
- [ ] Sanitización de datos sensibles

#### Gestión de Secretos
- [ ] No hay secrets hardcodeados
- [ ] Usa `process.env` para variables sensibles
- [ ] `.env` está en `.gitignore`
- [ ] No hay keys de API en el código

#### Logging Seguro
- [ ] No hay `console.log` en producción
- [ ] Usa `logger.ts` para logging
- [ ] No loguea passwords, tokens, PII completo
- [ ] Sentry configurado para captura de errores

---

### 2. TypeScript (ALTO)

#### Tipos Explícitos
- [ ] No usa `any` (usar `unknown` + type guards)
- [ ] Interfaces definidas para objetos
- [ ] Tipos de retorno explícitos en funciones
- [ ] Database types importados de Supabase

#### Null Safety
- [ ] Manejo adecuado de `null` y `undefined`
- [ ] Optional chaining (`?.`) donde aplica
- [ ] Nullish coalescing (`??`) para defaults
- [ ] No asume valores no nulos sin verificar

#### Generics y Utilities
- [ ] Usa generics cuando corresponde
- [ ] Utility types (`Pick`, `Omit`, `Partial`) apropiadamente
- [ ] Type guards para narrowing

---

### 3. React/Next.js (ALTO)

#### Componentes
- [ ] `'use client'` solo cuando es necesario
- [ ] Props tipadas con interfaces
- [ ] No muta props directamente
- [ ] Keys únicas en listas (no índices)

#### Hooks
- [ ] Dependencies completas en `useEffect`
- [ ] Cleanup en useEffects con subscriptions
- [ ] `useCallback` para funciones pasadas a hijos
- [ ] `useMemo` para cálculos costosos

#### Server Components
- [ ] Fetch de datos en Server Components (no useEffect)
- [ ] `createClient()` de servidor en Server Components
- [ ] `createClient()` de cliente en Client Components
- [ ] RevalidatePath después de mutaciones

#### Estados
- [ ] Loading states manejados
- [ ] Error states manejados
- [ ] Empty states considerados
- [ ] No renderiza antes de tener datos

---

### 4. Base de Datos (ALTO)

#### Queries
- [ ] Campos explícitos en `.select()` (no `*`)
- [ ] Límites en queries (`.limit()`)
- [ ] Índices en columnas de filtro
- [ ] Soft delete con `deleted_at` (si aplica)

#### Migraciones
- [ ] RLS habilitado en nuevas tablas
- [ ] Políticas de aislamiento creadas
- [ ] Triggers de `updated_at` incluidos
- [ ] Índices creados para performance
- [ ] Rollback probado (down migration)

#### Performance
- [ ] No hay N+1 queries
- [ ] Paginación implementada para listas grandes
- [ ] Cache configurado donde aplica
- [ ] No hay queries en loops

---

### 5. Testing (ALTO)

#### Cobertura
- [ ] Tests unitarios para lógica de negocio
- [ ] Tests de integración para APIs
- [ ] Tests de seguridad (cross-tenant, SQL injection)
- [ ] Coverage ≥80% para código crítico

#### Calidad de Tests
- [ ] Tests son independientes
- [ ] Tests son determinísticos
- [ ] Mocks configurados correctamente
- [ ] Assertions claros y específicos
- [ ] Describe/it con nombres descriptivos

#### Casos de Borde
- [ ] Input vacío/nulo
- [ ] Input inválido
- [ ] Límites (mínimos/máximos)
- [ ] Estados de error
- [ ] Concurrencia (si aplica)

---

### 6. Código (MEDIO)

#### Limpieza
- [ ] No hay código comentado (dead code)
- [ ] No hay imports no usados
- [ ] No hay variables no usadas
- [ ] Funciones pequeñas (<50 líneas)

#### Legibilidad
- [ ] Nombres descriptivos (variables, funciones)
- [ ] No hay magia (números mágicos, strings)
- [ ] Comentarios explican el POR QUÉ, no el QUÉ
- [ ] JSDoc en funciones públicas

#### DRY (Don't Repeat Yourself)
- [ ] No hay duplicación de lógica
- [ ] Utilidades compartidas cuando corresponde
- [ ] Patrones consistentes con código existente

#### Organización
- [ ] Imports organizados (externos → internos → relativos)
- [ ] Funciones en orden lógico
- [ ] Archivos no exceden 400 líneas

---

### 7. UI/UX (MEDIO)

#### Accesibilidad
- [ ] Labels en inputs de formulario
- [ ] ARIA attributes donde aplica
- [ ] Focus management en modals/dialogs
- [ ] Keyboard navigation funcional
- [ ] Contrast ratios adecuados

#### Responsive
- [ ] Mobile-first cuando corresponde
- [ ] Breakpoints de Tailwind usados correctamente
- [ ] No hay overflow horizontal
- [ ] Touch targets ≥44px

#### Feedback al Usuario
- [ ] Loading indicators visibles
- [ ] Mensajes de error claros
- [ ] Mensajes de éxito informativos
- [ ] Confirmación para acciones destructivas

---

### 8. Performance (MEDIO)

#### Bundle Size
- [ ] No hay imports innecesarios
- [ ] Lazy loading para componentes pesados
- [ ] Tree-shaking habilitado
- [ ] Imágenes optimizadas

#### Runtime
- [ ] No hay memory leaks
- [ ] Event listeners removidos en cleanup
- [ ] Debounce/throttle en inputs de búsqueda
- [ ] Virtualización para listas largas

---

### 9. Documentación (MEDIO)

#### Código
- [ ] JSDoc en funciones públicas
- [ ] Comentarios en lógica compleja
- [ ] README actualizado (si aplica)
- [ ] Ejemplos de uso (si aplica)

#### Cambios
- [ ] CHANGELOG actualizado (si aplica)
- [ ] Migraciones documentadas
- [ ] Variables de entorno documentadas
- [ ] Breaking changes identificados

---

## Proceso de Code Review

### 1. Antes de Enviar PR

```bash
# Ejecutar verificación completa
npm run check  # type-check + lint + test

# Build de producción
npm run build

# Auditoría de seguridad
npm run security:audit

# Verificar cambios
git diff main

# Ejecutar tests de seguridad específicos
npm test -- --testNamePattern="security"
```

### 2. Descripción del PR

```markdown
## Descripción
[Descripción clara y concisa del cambio]

## Tipo de Cambio
- [ ] 🐛 Bug fix
- [ ] ✨ Nueva feature
- [ ] 🔒 Seguridad
- [ ] 🧪 Tests
- [ ] 📚 Documentación
- [ ] ♻️ Refactor
- [ ] ⚡ Performance

## Seguridad
- [ ] No hay console.log en producción
- [ ] Validación Zod en inputs
- [ ] RLS aplicado en queries
- [ ] No hay datos sensibles expuestos

## Testing
- [ ] Tests unitarios agregados/actualizados
- [ ] Tests de seguridad incluidos
- [ ] Coverage ≥80% para código crítico
- [ ] Tests manuales de flujos críticos

## Checklist
- [ ] npm run check pasa
- [ ] npm run build pasa
- [ ] Documentación actualizada
- [ ] Breaking changes documentados

## Screenshots (si aplica)
[Capturas de pantalla del cambio]
```

### 3. Review por Pares

**Responsabilidades del Reviewer:**
- Revisar checklist completa
- Probar cambios localmente
- Verificar seguridad
- Comentar constructivamente
- Aprobar o solicitar cambios

**Tiempo máximo de review:** 24 horas hábiles

### 4. Aprobación y Merge

**Requisitos para merge:**
- [ ] ≥1 aprobación de reviewer
- [ ] Todos los checks de CI passing
- [ ] Sin conflictos con main
- [ ] Security audit passing

**Estrategia de merge:**
- Features: Squash and merge
- Hotfixes: Merge commit
- Refactors: Rebase and merge

---

## Patrones Comunes de Review

### ❌ Patrones a Rechazar

```typescript
// 1. Any type
const data: any = await fetch()

// 2. Select star
const { data } = await supabase.from('table').select('*')

// 3. Sin validación
async function create(data: any) {
  return db.insert(data)
}

// 4. Console.log en producción
console.log('User:', user)

// 5. Sin tenant_id
const customers = await supabase.from('customers').select()

// 6. Fetch en useEffect (debería ser Server Component)
useEffect(() => {
  fetch('/api/data').then(setData)
}, [])

// 7. Sin error handling
const { data } = await supabase.from('table').insert(data)
return data

// 8. Hardcodear secrets
const apiKey = 'sk_live_123456'
```

### ✅ Patrones a Aprobar

```typescript
// 1. Tipos explícitos
interface Customer {
  id: string
  name: string
}
const data: Customer[] = await fetch()

// 2. Campos explícitos
const { data } = await supabase
  .from('table')
  .select('id, name, email')

// 3. Validación Zod
const schema = z.object({ name: z.string() })
const validated = schema.parse(data)

// 4. Logger centralizado
logger.info('Action performed', { userId: user.id })

// 5. Con tenant_id
const { data } = await supabase
  .from('customers')
  .select('id, name')
  .eq('tenant_id', tenantId)

// 6. Server Component
export default async function Page() {
  const data = await db.query()
  return <Client data={data} />
}

// 7. Error handling completo
try {
  const { data, error } = await supabase
    .from('table')
    .insert(data)
  if (error) throw error
  return data
} catch (error) {
  logger.error('Failed', { error })
  throw error
}

// 8. Variables de entorno
const apiKey = process.env.API_KEY!
```

---

## Herramientas de Review Automático

### GitHub Actions

```yaml
name: Code Review

on:
  pull_request:
    branches: [main, develop]

jobs:
  review:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint
        
      - name: Test
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Security audit
        run: npm run security:audit
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Comandos de Validación

```bash
# Validación local pre-PR
npm run check              # type-check + lint + test
npm run build              # build de producción
npm run security:audit     # auditoría de seguridad
npm run security:validate  # validar reporte JSON

# Herramientas adicionales
npx ts-prune               # detectar código muerto
npx knip                   # detectar imports no usados
npm audit                  # vulnerabilidades
```

---

## Métricas de Calidad de PR

### Security Score
| Métrica | Meta | Actual |
|---------|------|--------|
| RLS coverage | 100% | - |
| Select star count | 0 | - |
| Any type count | 0 | - |
| Zod validation | 100% | - |
| Tenant isolation | 100% | - |

### Code Quality Score
| Métrica | Meta | Actual |
|---------|------|--------|
| Type safety | 100% | - |
| Error handling | 100% | - |
| Test coverage | ≥80% | - |
| Documentation | ≥90% | - |

---

## Referencias

- [SECURITY_CHECKLIST.md](../docs/security/SECURITY_CHECKLIST.md)
- [SECURITY_QUICK_REFERENCE.md](../docs/security/SECURITY_QUICK_REFERENCE.md)
- [CODE_STANDARDS.md](../docs/CODE_STANDARDS.md)
- [TESTING_GUIDE.md](../docs/TESTING_GUIDE.md)

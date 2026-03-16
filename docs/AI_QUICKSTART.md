# 🚀 AI QUICKSTART GUIDE

> **Guía de Inicio Rápido para IAs de Antigravity**
> 
> Si eres una IA nueva uniéndote al proyecto, lee esto en los primeros 5 minutos.

---

## ⚡ PRIMERO: Lee en Este Orden (15 minutos)

### Minuto 1-5: Contexto General
1. **`../ARCHITECTURE_SUMMARY.md`** ← Empieza aquí
   - Te da el panorama completo del proyecto
   - Muestra el estado actual y prioridades
   - Lista las reglas inmutables

### Minuto 5-10: Estado Actual
2. **`./PROGRESS_TRACKER.md`**
   - Qué se hizo en la última sesión
   - Qué toca hacer ahora
   - Decisiones técnicas recientes

### Minuto 10-15: Tarea Específica
3. **`./TASK_HANDOFF_TEMPLATE.md`** (si existe)
   - Contexto de la tarea en curso
   - Problemas encontrados
   - Próximos pasos concretos

---

## 🎯 TU PRIMERA TAREA TÍPICA

### Escenario: Continuar desarrollo después de otra IA

```bash
# 1. Verifica el estado del repositorio
git status
git log -n 5

# 2. Revisa si hay cambios no commiteados
git diff

# 3. Lee el handoff de la sesión anterior
cat docs/TASK_HANDOFF_TEMPLATE.md

# 4. Ejecuta el proyecto en local
npm run dev

# 5. Abre el navegador en http://localhost:3000
```

### Antes de Tocar Código
- [ ] Leí `ARCHITECTURE_SUMMARY.md`
- [ ] Leí `PROGRESS_TRACKER.md`
- [ ] Entiendo qué se hizo en la sesión anterior
- [ ] Sé cuál es mi tarea inmediata
- [ ] Tengo claro el criterio de éxito

---

## 📚 DOCUMENTACIÓN ESENCIAL POR CONTEXTO

### Si Vas a Desarrollar una Feature Nueva
1. `MODULE_BLUEPRINT.md` - Patrón a seguir
2. `DATABASE_SCHEMA.md` - Estructura de DB
3. `PERMISSIONS_MATRIX.md` - Permisos necesarios

### Si Vas a Arreglar un Bug
1. `SECURITY_CHECKLIST.md` - Verificar si es tema de seguridad
2. `BUSINESS_FLOWS.md` - Entender el flujo afectado
3. `TROUBLESHOOTING.md` - Ver si el error ya está documentado

### Si Vas a Escribir Tests
1. `QA_GUIDE.md` - Estándares de testing
2. `Vitest` docs - Framework que usamos

### Si Vas a Tocar Autenticación/Permisos
1. `SECURITY_CHECKLIST.md` - CRÍTICO
2. `PERMISSIONS_MATRIX.md` - Matriz de roles
3. `ARCHITECTURE_SUMMARY.md` - Reglas de RLS

---

## 🚨 ERRORES COMUNES DE IAs NUEVAS

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
  .select('id, name, email')
  .eq('tenant_id', tenantId)
```

**Lección:** Multi-tenancy NO es negociable.

### ❌ Error 3: Usar `any` en TypeScript
```typescript
// ❌ MAL
function createCustomer(data: any) {}

// ✅ BIEN
interface CreateCustomerDTO {
  name: string
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

## 🛠️ CHECKLIST RÁPIDA ANTES DE COMMITEAR

### Código
- [ ] No dejé `console.log` (usar `logger.ts`)
- [ ] No usé `any` (usar tipos o `unknown`)
- [ ] No hice `select('*')` (campos explícitos)
- [ ] Validé inputs con Zod
- [ ] Respété RLS (tenant_id en queries)

### Tests
- [ ] Tests existentes pasan: `npm test`
- [ ] Agregué tests para nueva funcionalidad
- [ ] Coverage no disminuyó

### Calidad
- [ ] `npm run lint` pasa
- [ ] `npm run format` aplicado
- [ ] `npm run type-check` pasa

### Build
- [ ] `npm run build` pasa sin errores

---

## 📞 CUÁNDO PEDIR AYUDA

### Pide ayuda si...
- ⚠️ Llevas >30 minutos atascado en lo mismo
- ⚠️ Encontraste un bug de seguridad (RLS, auth, permisos)
- ⚠️ No estás seguro de si romperás producción
- ⚠️ La tarea no está clara después de leer la docs

### No necesitas pedir ayuda si...
- ✅ Es un cambio cosmético (UI, textos, colores)
- ✅ Es seguir un patrón ya establecido
- ✅ Es escribir tests para código existente
- ✅ Es actualizar documentación

---

## 🎯 FLUJO DE TRABAJO IDEAL

```
1. Leer handoff anterior (si existe)
   ↓
2. Leer documentación relevante
   ↓
3. Entender el contexto de negocio
   ↓
4. Planear implementación
   ↓
5. Escribir código siguiendo patrones existentes
   ↓
6. Correr tests y lint
   ↓
7. Hacer commit con mensaje claro
   ↓
8. Actualizar handoff para la próxima IA
```

---

## 💡 TIPS DE PRODUCTIVIDAD

### Comandos Útiles
```bash
# Ver código no usado
npx ts-prune

# Ver imports no usados
npx knip

# Correr tests en watch
npm run test:watch

# Build rápido para verificar
npm run build -- --no-lint
```

### Atajos de Desarrollo
```bash
# Crear componente siguiendo patrón
cp src/components/customers/CustomerDialog.tsx \
   src/components/customers/NuevoDialog.tsx

# Buscar uso de una función
grep -r "createCustomer" src/

# Ver historial de un archivo
git log --follow src/archivo.ts
```

### Cuando Algo No Funciona
1. Revisa la consola del navegador (F12)
2. Revisa logs del servidor (terminal)
3. Revisa si es tema de RLS (políticas de Supabase)
4. Revisa si es tema de permisos (roles de usuario)
5. Pide ayuda si después de 30 minutos no avanzas

---

## 🎓 APRENDIZAJE CONTINUO

### Recursos Recomendados
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn/UI Docs](https://ui.shadcn.com)
- [Zod Docs](https://zod.dev)
- [Vitest Docs](https://vitest.dev)

### Canales de Slack
- `#dashboard-universal` - Proyecto general
- `#dev-help` - Ayuda técnica
- `#announcements` - Actualizaciones importantes

---

## ✨ AL TERMINAR TU SESIÓN

### Obligatorio
1. Hacer commit de todos los cambios
2. Actualizar `TASK_HANDOFF_TEMPLATE.md`
3. Actualizar `PROGRESS_TRACKER.md` (si aplica)
4. Dejar el código en estado compilable

### Recomendado
1. Comentar código complejo
2. Actualizar documentación si cambiaste algo
3. Dejar tests en verde
4. Limpiar archivos temporales

---

**¡Bienvenida al equipo! 🚀**

*Si tienes dudas, recuerda: la documentación es tu mejor amiga.*

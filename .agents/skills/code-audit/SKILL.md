---
name: code-audit
description: >
  Auditoría técnica integral de proyectos de software: detectar código muerto,
  redundancias, deuda técnica, antipatrones, problemas de seguridad y calidad.
  Usar cuando el usuario quiera: revisar la calidad del código, encontrar
  problemas técnicos, reducir deuda técnica, preparar el proyecto para
  producción, hacer code review, buscar código sin usar, o evaluar el
  estado técnico general del proyecto.
  Activar con: auditoría, code review, deuda técnica, calidad, redundancia,
  código muerto, antipatrón, refactor, revisar, evaluar.
---

# Auditoría de Código

## Metodología de auditoría por capas

```
Capa 1 — Seguridad (prioridad máxima)
Capa 2 — Arquitectura y diseño
Capa 3 — Calidad de código
Capa 4 — Rendimiento
Capa 5 — Deuda técnica
```

---

## Capa 1 — Seguridad

### Checklist de seguridad crítica
```bash
# Buscar secrets hardcodeados
grep -rn "password\|secret\|token\|key" src/ --include="*.ts" |
  grep -v "process.env\|placeholder\|example\|test"

# Buscar rutas sin protección
grep -rn "export async function" src/app/api --include="*.ts" |
  grep -v "getUser\|withAuth"

# Buscar service_role en cliente
grep -rn "SERVICE_ROLE" src/app --include="*.tsx" --include="*.ts"

# Verificar que tenant_id no viene del body
grep -rn "req.body.tenant_id\|body.tenant_id" src/ --include="*.ts"
```

### Red flags de seguridad
- `select('*')` sin filtro de tenant
- `tenant_id` tomado del body de la request
- `service_role_key` en código cliente
- Contraseñas hardcodeadas
- Variables de entorno en código
- Endpoints sin verificar autenticación
- SQL concatenado manualmente

---

## Capa 2 — Arquitectura

### Detectar violaciones de principios

**SRP — Archivos que hacen demasiado**
```bash
# Archivos con más de 400 líneas
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l |
  sort -n | awk '$1 > 400 {print}'
```

**DRY — Código duplicado**
```bash
# Buscar patrones repetidos manualmente:
# - Mismo fetch de Supabase en múltiples componentes
# - Misma validación en varios lugares
# - Misma lógica de autorización repetida
grep -rn "supabase.from('tenants')" src/ --include="*.ts" --include="*.tsx"
```

**Dependencias circulares**
```bash
npx madge --circular src/
```

### Antipatrones arquitectónicos a buscar
- Lógica de negocio en componentes UI
- Fetch de datos en componentes client cuando podría ser server
- Estado global para datos que son locales
- Prop drilling más de 3 niveles
- God components (componentes con 500+ líneas)

---

## Capa 3 — Calidad de código TypeScript

### Métricas automáticas
```bash
# 1. Errores de TypeScript
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# 2. Usos de 'any'
grep -rn ": any\|as any\| any " src/ --include="*.ts" --include="*.tsx" |
  grep -v "//.*any\|eslint-disable" | wc -l

# 3. TODOs y FIXMEs pendientes
grep -rn "TODO\|FIXME\|HACK\|TEMP\|XXX" src/ --include="*.ts" --include="*.tsx"

# 4. Console.logs en producción
grep -rn "console\.log\|console\.error" src/ --include="*.ts" --include="*.tsx" |
  grep -v "//.*console\|test\|\.test\." | wc -l

# 5. Código comentado
grep -rn "^// \|^/\*" src/ --include="*.ts" --include="*.tsx" | wc -l
```

### Reporte de calidad
```markdown
## Score de calidad TypeScript

| Métrica | Valor | Target | Estado |
|---------|-------|--------|--------|
| Errores TS | X | 0 | ✅/❌ |
| Usos de 'any' | X | <10 | ✅/❌ |
| TODOs pendientes | X | <5 | ✅/❌ |
| Console.logs | X | 0 en prod | ✅/❌ |
| Archivos >400 líneas | X | 0 | ✅/❌ |
```

---

## Capa 4 — Rendimiento

### Frontend
```bash
# Componentes client que deberían ser server
grep -rn "'use client'" src/app --include="*.tsx" |
  while read file; do
    echo "$file"
    # Revisar manualmente si usa useState, useEffect o eventos
  done

# Imágenes sin next/image
grep -rn "<img " src/ --include="*.tsx" | grep -v "//.*<img"

# Imports innecesarios pesados
grep -rn "import \* as" src/ --include="*.ts" --include="*.tsx"
```

### Backend y DB
```bash
# Queries sin límite (potencialmente peligrosas)
grep -rn "\.from(" src/ --include="*.ts" --include="*.tsx" |
  grep -v "\.limit\|\.single\|count"

# select('*') sin justificación
grep -rn "select('\*')" src/ --include="*.ts" --include="*.tsx"

# Queries dentro de loops (N+1)
# Buscar manualmente: for/forEach/map que contengan supabase.from()
```

---

## Capa 5 — Deuda técnica

### Inventario de deuda técnica
```markdown
## Inventario de deuda técnica

### Crítica (bloquea producción)
- [ ] [descripción] — Archivo: [ruta] — Esfuerzo: [horas]

### Alta (afecta estabilidad)
- [ ] [descripción] — Archivo: [ruta] — Esfuerzo: [horas]

### Media (afecta mantenibilidad)
- [ ] [descripción] — Archivo: [ruta] — Esfuerzo: [horas]

### Baja (mejora la calidad)
- [ ] [descripción] — Archivo: [ruta] — Esfuerzo: [horas]
```

---

## Reporte de auditoría — template

```markdown
# Auditoría Técnica — [Proyecto] — [Fecha]

## Score General: X/10

| Área | Score | Tendencia |
|------|-------|-----------|
| Seguridad | X/10 | ↑↓→ |
| Arquitectura | X/10 | ↑↓→ |
| Calidad TypeScript | X/10 | ↑↓→ |
| Rendimiento | X/10 | ↑↓→ |
| Deuda técnica | X/10 | ↑↓→ |

## 🔴 Errores Críticos
[Riesgo de seguridad o bugs fatales que deben resolverse YA]

## 🟡 Deuda Técnica
[Aspectos que funcionan pero deben mejorar]

## 🚀 Quick Wins
[3 cambios de alto impacto con bajo esfuerzo]

## Métricas
- Archivos TypeScript: X
- Usos de 'any': X
- Errores de compilación: X
- TODOs pendientes: X
- Líneas de código total: X
- Cobertura de tests: X%

## Plan de acción priorizado
1. [acción] — Esfuerzo: [tiempo] — Impacto: Alto/Medio/Bajo
2. ...
```

---

## Checklist de auditoría completa

```
Seguridad:
[ ] Sin secrets hardcodeados en código
[ ] Todas las API routes verifican auth
[ ] tenant_id siempre del JWT
[ ] RLS habilitado en todas las tablas
[ ] Sin service_role_key en cliente

Código:
[ ] 0 errores de TypeScript
[ ] Menos de 10 usos de 'any'
[ ] Sin console.log en producción
[ ] Sin código comentado obsoleto
[ ] Sin archivos de debug en repo

Arquitectura:
[ ] Sin archivos >400 líneas
[ ] Sin funciones >50 líneas
[ ] Sin lógica duplicada en 2+ lugares
[ ] Componentes con responsabilidad única
[ ] No hay dependencias circulares

Rendimiento:
[ ] Páginas de lista como Server Components
[ ] Queries con límite y columnas específicas
[ ] Sin select('*') sin justificación
[ ] Sin queries en loops
[ ] Imágenes con next/image

Deuda técnica:
[ ] Todos los TODOs tienen fecha y responsable
[ ] Deuda técnica documentada y priorizada
[ ] Ningún 'temporal' lleva más de 30 días
```

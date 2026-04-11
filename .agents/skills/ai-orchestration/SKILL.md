---
name: ai-orchestration
description: >
  Orquestación profesional de agentes de IA para desarrollo de software.
  Usar cuando el usuario quiera: coordinar múltiples agentes IA, crear
  prompts estructurados para agentes, definir roles de agentes, gestionar
  contexto entre sesiones, crear skills personalizados, implementar
  memoria persistente para agentes, o mejorar la calidad del código
  generado por IA. Activar con: agente, orquestación, prompt, Antigravity,
  Qwen, contexto, memoria, skill, Claude Code, coordinación de IA.
---

# Orquestación de Agentes IA

## El problema del "vibe coding"

```
Sin orquestación:
→ Cada sesión empieza desde cero
→ Cada agente toma decisiones arbitrarias
→ El código es inconsistente entre sesiones
→ Nadie sabe exactamente qué está bien y qué no
→ Deuda técnica invisible acumulándose

Con orquestación:
→ Contexto persistente entre sesiones
→ Cada agente tiene un rol claro
→ Estándares consistentes en todo el código
→ Estado del proyecto siempre documentado
→ Calidad predecible y mejorando
```

---

## Arquitectura multi-agente

### Roles fijos

```
ORQUESTADOR — Claude (este chat)
Responsabilidades:
  → Arquitectura y decisiones técnicas
  → Generación de prompts para ejecutores
  → Validación del resultado
  → Documentación y changelog
  → Resolución de conflictos entre agentes

NO hace:
  → No ejecuta código directamente en el proyecto
  → No hace commits
  → No modifica archivos sin generar prompt estructurado

EJECUTOR UI — Antigravity (Gemini IDE)
Responsabilidades:
  → Implementar componentes React/Next.js
  → Actualizar estilos y layouts
  → Refactorizar código frontend
  → Correr TypeScript y lint

NO hace:
  → No toma decisiones de arquitectura
  → No modifica schema de DB sin instrucción
  → No cambia convenciones de naming

EJECUTOR DB/CLI — Qwen Code
Responsabilidades:
  → Ejecutar migraciones SQL
  → Correr scripts de Node.js
  → Operaciones de filesystem
  → Comandos de terminal

NO hace:
  → No modifica código TypeScript
  → No ejecuta SQL destructivo sin confirmación explícita
  → No cambia variables de entorno sin instrucción
```

---

## Documentos de coordinación

### PROJECT_STATE.md — estado actual
```markdown
# Estado del Proyecto — [fecha de actualización]

## ✅ Funcionando en producción
- [módulo/feature]: [descripción breve]
- ...

## 🟡 En desarrollo
- [módulo/feature]: [descripción y estado]
- ...

## 🔴 Roto / Pendiente crítico
- [problema]: [descripción y bloqueo]
- ...

## 📋 Backlog priorizado
1. [tarea más prioritaria]
2. ...

## Deuda técnica conocida
- [deuda]: [impacto]
- ...

## Próxima sesión
- Objetivo: [qué se va a lograr]
- Agente principal: [Claude/Antigravity/Qwen]
```

### AI_SYNC.md — roles de agentes
```markdown
# Coordinación de Agentes IA

## Arquitectura de agentes
- **Claude**: Orquestador y arquitecto senior
- **Antigravity**: Ejecutor de UI/React/Next.js
- **Qwen**: Ejecutor de CLI/DB/migraciones

## Convenciones acordadas
- IDs de módulos: siempre lowercase
- Rutas de admin: /console/* (no /superadmin/*)
- Precios: siempre en COP como INTEGER
- tenant_id: siempre del JWT, nunca del body

## Cómo pasar trabajo entre agentes
1. Claude genera el prompt estructurado
2. James lo pasa al agente ejecutor
3. El ejecutor implementa y reporta
4. Claude valida y documenta
```

---

## Prompts estructurados

### Template de prompt para Antigravity
```
## Contexto
[Descripción breve del estado actual]

## Tarea
[Qué debe hacer específicamente]

## Archivos a modificar
- `src/ruta/archivo.tsx`: [qué cambiar]

## Código exacto a implementar
[Código completo si es posible]

## Convenciones a respetar
- [convención 1]
- [convención 2]

## Verificación
Al terminar, ejecutar:
1. npx tsc --noEmit
2. [verificación específica de la tarea]

## Resultado esperado
[Descripción de cómo debe quedar]
```

### Template de prompt para Qwen (SQL)
```
## Contexto
[Descripción del estado actual de la DB]

## Tarea SQL
[Qué debe ejecutar]

## SQL a ejecutar (copiar exactamente)
```sql
[SQL aquí]
```

## Verificación post-ejecución
```sql
[Query para verificar que quedó bien]
```

## ADVERTENCIA
[Si hay riesgo de pérdida de datos, especificarlo]
Confirmar antes de ejecutar si: [condición]
```

---

## Gestión de contexto

### Inicio de sesión — protocolo
```
1. Leer PROJECT_STATE.md para entender el estado actual
2. Identificar el objetivo de la sesión
3. Leer el skill correspondiente a la tarea
4. Verificar que no hay trabajo en progreso bloqueante
5. Definir el output esperado antes de empezar
```

### Fin de sesión — protocolo
```
1. Actualizar PROJECT_STATE.md con lo que cambió
2. Agregar entrada al CHANGELOG.md
3. Si se tomó una decisión arquitectónica → documentar en DECISIONS.md
4. Definir el objetivo de la próxima sesión
5. Hacer commit con mensaje descriptivo
```

### DECISIONS.md — decisiones arquitectónicas
```markdown
# Decisiones Arquitectónicas

## [fecha] — [título de la decisión]
**Contexto:** [por qué se tomó esta decisión]
**Decisión:** [qué se decidió]
**Alternativas consideradas:** [qué más se evaluó]
**Consecuencias:** [qué implica esta decisión]
**Estado:** Activa / Supersedida por [fecha]
```

---

## Skills personalizados para el proyecto

### Cómo crear un skill
```markdown
1. Identificar una tarea repetitiva que el agente hace mal
2. Documentar el patrón correcto
3. Crear el archivo SKILL.md con:
   - Frontmatter (name, description)
   - Cuándo usar el skill
   - El patrón correcto con ejemplos
   - Checklist de verificación
4. Probarlo con una tarea real
5. Iterar basado en el resultado
```

### Skills específicos para Antigravity
```markdown
# antigravity-conventions.md
Convenciones específicas del proyecto:
- Rutas: /console/* para admin
- Módulos: siempre lowercase
- Precios: INTEGER en COP
- Cliente Supabase: server en SC, client en CC
- Errores: siempre apiError/apiSuccess
```

---

## Métricas de calidad de orquestación

### Indicadores de buena orquestación
- ✅ TypeScript sin errores después de cada sesión
- ✅ Un solo propósito por prompt
- ✅ PROJECT_STATE.md actualizado al final de cada sesión
- ✅ Cada agente respeta su rol
- ✅ Sin decisiones de arquitectura tomadas por ejecutores

### Señales de orquestación deficiente
- ❌ Antigravity modifica schema de DB
- ❌ Qwen refactoriza componentes React
- ❌ Código inconsistente entre sesiones
- ❌ No hay registro de qué se hizo y por qué
- ❌ El agente ejecutor inventa convenciones

---

## Engram y memoria persistente

### Qué recordar entre sesiones
```
Decisiones técnicas:
- Por qué se eligió X sobre Y
- Qué se intentó y no funcionó
- Convenciones acordadas

Estado del proyecto:
- Qué funciona y qué no
- Deuda técnica acumulada
- Próximas tareas

Patrones del proyecto:
- Cómo se estructura el código
- Qué librerías se usan y cómo
- Flujos de datos
```

### Sin Engram — alternativa manual
```
Mantener actualizados:
→ PROJECT_STATE.md  (estado actual)
→ DECISIONS.md      (por qué se hizo así)
→ AI_SYNC.md        (roles de agentes)
→ CHANGELOG.md      (qué cambió y cuándo)

Al inicio de cada sesión:
→ Pegar el contenido de PROJECT_STATE.md
→ Mencionar el objetivo de la sesión
→ El orquestador retoma desde ahí
```

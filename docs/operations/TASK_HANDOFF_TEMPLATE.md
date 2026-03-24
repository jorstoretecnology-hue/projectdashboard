# 🔄 TASK HANDOFF TEMPLATE

> **Plantilla para Transferencia de Contexto entre IAs**
> 
> Usar este formato al final de cada sesión de trabajo para que la siguiente IA pueda continuar sin perder contexto.

---

## 📋 INFORMACIÓN DE LA SESIÓN

| Campo | Valor |
|-------|-------|
| **Fecha** | YYYY-MM-DD |
| **IA que reporta** | [Nombre/ID de la IA] |
| **Sesión #** | [Número de sesión] |
| **Duración** | [X horas/minutos] |

---

## ✅ QUEDÓ PENDIENTE (CONTEXT CRÍTICO)

### Tarea Principal en Curso
```
Descripción clara de lo que se estaba trabajando cuando se terminó la sesión.
Incluir el "por qué" de la tarea, no solo el "qué".
```

### Estado Actual
- **Último commit:** `[hash o mensaje del último commit]`
- **Archivos modificados:** 
  - `src/ruta/archivo1.ts` - Cambios realizados
  - `src/ruta/archivo2.tsx` - Cambios realizados
- **Branch:** `nombre-de-la-rama`

### Próximos Pasos Inmediatos
1. **Paso 1:** Acción concreta a realizar primero
2. **Paso 2:** Acción concreta a realizar segundo
3. **Paso 3:** Acción concreta a realizar tercero

---

## 🎯 DECISIONES TÉCNICAS TOMADAS

### Decisión 1: [Nombre de la decisión]
```
Descripción de la decisión tomada.
```

**Alternativas consideradas:**
- Opción A: [Descripción] - ¿Por qué se descartó?
- Opción B: [Descripción] - ¿Por qué se descartó?

**Razón de la decisión final:**
[Explicación del por qué se eligió esta opción]

**Impacto:**
- [ ] Requiere migración de DB
- [ ] Cambia API pública
- [ ] Afecta performance
- [ ] Requiere actualización de docs

### Decisión 2: [Nombre de la decisión]
[Repetir estructura anterior]

---

## ⚠️ PROBLEMAS ENCONTRADOS

### Problema 1: [Descripción breve]
**Síntomas:**
- Qué error se vio
- Cuándo ocurre
- Qué lo desencadena

**Intentos de solución:**
1. Intento 1: [Qué se probó] - Resultado: [Éxito/Fracaso]
2. Intento 2: [Qué se probó] - Resultado: [Éxito/Fracaso]

**Hipótesis actual:**
[Qué crees que podría ser la causa raíz]

**Sugerencias para continuar:**
[Qué más se podría probar]

### Problema 2: [Descripción breve]
[Repetir estructura anterior]

---

## 📚 ARCHIVOS CREADOS/MODIFICADOS

### Nuevos Archivos
| Ruta | Propósito | Estado |
|------|-----------|--------|
| `src/nuevo/archivo.ts` | Descripción breve | ✅ Completo / 🚧 Incompleto |
| `src/otro/archivo.tsx` | Descripción breve | ✅ Completo / 🚧 Incompleto |

### Archivos Modificados
| Ruta | Cambios | Razón |
|------|---------|-------|
| `src/existente/archivo.ts` | Se agregó X, se eliminó Y | Para implementar Z |
| `src/otro/archivo.tsx` | Refactorización completa | Mejorar performance |

### Archivos para Eliminar
| Ruta | Razón |
|------|-------|
| `src/archivo-inutil.ts` | Ya no se usa, fue reemplazado por X |

---

## 🧪 TESTING

### Tests Creados
```typescript
// src/__tests__/nuevo-test.test.ts
describe('Nueva funcionalidad X', () => {
  it('debería hacer Y', async () => {
    // Test pendiente de implementar
  })
})
```

### Tests que Fallan
| Test | Archivo | Error | Prioridad |
|------|---------|-------|-----------|
| `test nombre` | `archivo.test.ts` | Mensaje de error | Alta/Media/Baja |

### Coverage Actual
- **Antes:** X%
- **Después:** Y%
- **Objetivo:** Z%

---

## 🔗 DEPENDENCIAS Y REFERENCIAS

### Tickets/Issues Relacionados
- [#123](link) - Descripción
- [#456](link) - Descripción

### PRs Pendientes
- [PR #789](link) - Descripción - Reviewer: @nombre

### Documentación Actualizada
- [ ] `README.md`
- [ ] `docs/FEATURE.md`
- [ ] `ARCHITECTURE_SUMMARY.md`
- [ ] Otro: [ especificar ]

---

## 💡 CONOCIMIENTO ADQUIRIDO (LEARNINGS)

### Descubrimiento 1
```
Algo importante que se aprendió durante esta sesión.
Ej: "Se descubrió que Supabase RLS tiene un bug con queries que usan DISTINCT"
```

### Truco/Atajo Descubierto
```
Algo que facilite el trabajo futuro.
Ej: "Se puede usar `npx ts-prune | grep -v node_modules` para filtrar resultados"
```

### Advertencia para el Futuro
```
Algo que se debe evitar en el futuro.
Ej: "No usar `select('*')` en la tabla audit_logs porque tiene 200+ columnas"
```

---

## 🎯 CONTEXTO DE NEGOCIO

### ¿Por qué esta tarea es importante?
```
Explicación del valor de negocio de lo que se está construyendo.
Ej: "Esta feature permite que los usuarios del plan Pro gestionen inventarios multi-sede"
```

### ¿Quién se beneficia?
- **Usuarios finales:** [Descripción]
- **Equipo de soporte:** [Descripción]
- **Equipo de desarrollo:** [Descripción]

### Métricas de Éxito
- [ ] Feature adoptada por X% de usuarios
- [ ] Reducción de Y% en tickets de soporte
- [ ] Mejora de Z% en performance

---

## 🚨 BLOQUEADORES ACTUALES

### Bloqueador 1: [Descripción]
**Tipo:** 
- [ ] Técnico
- [ ] Dependencia externa
- [ ] Falta de información
- [ ] Permisos/acceso

**Acciones tomadas:**
- [ ] Se contactó a [persona/equipo]
- [ ] Se investigó en [documentación/recurso]
- [ ] Se creó workaround temporal

**Qué se necesita para desbloquear:**
[Acción concreta que la siguiente IA puede tomar]

---

## 📝 NOTAS ADICIONALES

### Comentarios de Código Pendientes
```typescript
// src/archivo.ts:45
// TODO: La siguiente IA debe implementar X porque...
// FIXME: Esto es un hack temporal, la solución real es Y
// HACK: Workaround para el bug de Supabase #12345
```

### Conversaciones Pendientes
- [ ] Hablar con [equipo/persona] sobre [tema]
- [ ] Preguntar a [usuario/stakeholder] sobre [requisito]

### Investigación Pendiente
- [ ] Investigar [tecnología/librería] para [propósito]
- [ ] Leer [documentación/artículo] sobre [tema]

---

## ✨ CHECKLIST DE CIERRE DE SESIÓN

### Antes de Terminar
- [ ] Hice commit de todos los cambios
- [ ] Los tests existentes pasan
- [ ] No dejé console.log en el código
- [ ] Actualicé este documento de handoff
- [ ] Dejé el código en estado compilable

### Para la Próxima Sesión
- [ ] La próxima IA sabe por dónde empezar
- [ ] Las decisiones técnicas están documentadas
- [ ] Los problemas están claramente descritos
- [ ] El contexto de negocio está claro

---

## 🎯 RESUMEN EJECUTIVO (TL;DR)

**En una frase:**
[Resume en una oración qué se hizo y qué sigue]

**Ejemplo:**
> "Se implementó el 80% del servicio de emails con Resend. Falta configurar los templates y tests. Empezar por `src/lib/resend.ts` línea 45."

---

**Fin del Handoff**

*La próxima IA debe leer esto PRIMERO antes de tocar código.*

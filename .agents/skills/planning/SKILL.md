---
name: project-planning
description: >
  Planeación profesional de proyectos de software desde cero o continuación
  de proyectos existentes. Usar cuando el usuario quiera: definir un MVP,
  priorizar features, crear un roadmap, estimar tiempos, definir el nicho
  de mercado, analizar competencia, diseñar la arquitectura general, crear
  documentos de requisitos, o planear un sprint. Activar con palabras clave:
  planear, roadmap, MVP, feature, nicho, mercado, requisitos, sprint, backlog.
---

# Planeación de Proyectos de Software

## Fase 0 — Antes de escribir una línea de código

### Las 5 preguntas que definen todo

1. **¿Qué problema específico resuelve?**
   - Describir el dolor en términos del usuario, no del sistema
   - Mala respuesta: "gestión de inventario"
   - Buena respuesta: "el dueño del taller pierde 2 horas al día buscando repuestos en cuadernos"

2. **¿Quién es el usuario ideal (ICP)?**
   - Industria, tamaño, ubicación, nivel técnico, presupuesto
   - Ejemplo: "dueño de taller mecánico en ciudad colombiana mediana, 2-5 empleados, usa WhatsApp para todo, presupuesto <$200k/mes"

3. **¿Cuál es la alternativa actual del usuario?**
   - Excel, papel, WhatsApp, software genérico
   - Esto define tu ventaja competitiva real

4. **¿Cuánto pagaría por resolverlo?**
   - Regla: máximo 1-2% de sus ingresos mensuales
   - Validar con al menos 3 usuarios reales antes de construir

5. **¿Qué debe funcionar el día 1 para que alguien pague?**
   - Eso es tu MVP — no más, no menos

---

## Definición de MVP

### Lo que ENTRA al MVP
- La función que resuelve el dolor principal
- Flujo mínimo: crear → guardar → consultar
- Auth básica (login/logout)
- Un solo tipo de usuario

### Lo que NO entra al MVP
- Reportes avanzados
- Integraciones externas
- Personalización de UI
- Multi-idioma
- App móvil
- Cualquier "sería bueno tener"

### Template de definición de MVP

```markdown
## MVP de [nombre del producto]

**Usuario objetivo:** [descripción específica]
**Dolor principal:** [problema en palabras del usuario]
**Solución mínima:** [qué debe poder hacer]

**Flujos críticos (sin estos no hay producto):**
1. [flujo 1]
2. [flujo 2]
3. [flujo 3]

**Fuera del alcance del MVP:**
- [cosa 1]
- [cosa 2]

**Definición de "listo para cobrar":**
[criterio medible y específico]
```

---

## Roadmap

### Estructura de fases

```
Fase 0 — Validación (antes de código)
  → Hablar con 5 usuarios potenciales
  → Confirmar que pagarían
  → Definir precio

Fase 1 — MVP (4-8 semanas)
  → Solo los flujos críticos
  → Sin pulir UI
  → Deploy básico funcional

Fase 2 — Primeros clientes (4-8 semanas)
  → Onboarding del primer cliente real
  → Bugs críticos del mundo real
  → Feedback loop activo

Fase 3 — Producto (ongoing)
  → Features basadas en feedback real
  → Solo construir lo que 3+ clientes piden
  → Nunca construir para un solo cliente
```

### Priorización de features

Usar matriz de impacto vs esfuerzo:

```
ALTO IMPACTO + BAJO ESFUERZO  → Hacer primero (Quick Wins)
ALTO IMPACTO + ALTO ESFUERZO  → Planear con cuidado
BAJO IMPACTO + BAJO ESFUERZO  → Hacer si sobra tiempo
BAJO IMPACTO + ALTO ESFUERZO  → Nunca hacer
```

---

## Análisis de competencia

### Template de análisis

```markdown
## Competidor: [nombre]
- **Precio:** [desde X hasta Y]
- **Mercado objetivo:** [descripción]
- **Fortaleza principal:** [qué hacen bien]
- **Debilidad principal:** [qué hacen mal]
- **Lo que no tienen:** [oportunidad]
- **Precio de referencia para mi nicho:** [implicación]
```

### Preguntas clave
- ¿Por qué un cliente elegiría mi producto sobre este?
- ¿Qué haría falta para que un cliente de este competidor migrara?
- ¿Hay clientes que ningún competidor sirve bien?

---

## Arquitectura general — decisiones tempranas

### Stack tecnológico
Definir antes de empezar y no cambiar sin razón fuerte:

```markdown
## Decisiones de stack

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend | Next.js 14+ App Router | SSR, RSC, file-based routing |
| Base de datos | PostgreSQL (Supabase) | RLS nativo, realtime, storage |
| Auth | Supabase Auth | Integrado con RLS |
| Estilos | Tailwind CSS | Utilidades, no componentes |
| Componentes | Radix UI / shadcn | Accesibles, sin estilos impuestos |
| Validación | Zod | TypeScript-first |
| Pagos | MercadoPago (LATAM) / Stripe (global) | Según mercado |
| Emails | Resend | Simple, confiable |
| Monitoreo | Sentry | Errores en producción |
| Deploy | Vercel | Zero-config para Next.js |
```

### Arquitectura multi-tenant — decidir el modelo

```
Opción A: Shared DB + Shared Schema + RLS (recomendado para startups)
  ✅ Simple, barato, fácil de mantener
  ✅ Un solo deploy para todos los clientes
  ❌ Todos los clientes en la misma versión

Opción B: Shared DB + Schema por tenant
  ✅ Mejor aislamiento
  ❌ Migraciones complejas, costoso

Opción C: DB por tenant
  ✅ Aislamiento total
  ❌ Solo para Enterprise con regulaciones estrictas
```

---

## Documentos de requisitos

### PRD (Product Requirements Document) mínimo

```markdown
# PRD: [nombre del feature]

**Problema que resuelve:** [descripción]
**Usuario afectado:** [rol específico]
**Prioridad:** Alta / Media / Baja
**Estimado:** [horas/días]

## Comportamiento esperado
[descripción en lenguaje natural de cómo debe funcionar]

## Criterios de aceptación
- [ ] Cuando [condición], el sistema debe [comportamiento]
- [ ] Cuando [condición], el sistema debe [comportamiento]

## Fuera del alcance
- [qué NO hace este feature]

## Preguntas abiertas
- [duda 1]
- [duda 2]
```

---

## Estimación de tiempos

### Reglas de estimación honesta

- Tomar la estimación inicial y multiplicar por 2
- Agregar 20% por integración y testing
- Agregar 20% por imprevistos
- Nunca estimar menos de medio día para cualquier tarea

### Template de sprint

```markdown
## Sprint [número] — [fecha inicio] al [fecha fin]

**Objetivo del sprint:** [una oración]

| Tarea | Estimado | Responsable | Estado |
|-------|----------|-------------|--------|
| [tarea] | [horas] | [agente/persona] | [pendiente/en progreso/listo] |

**Definición de "terminado":**
- [ ] Funciona en desarrollo
- [ ] TypeScript sin errores
- [ ] Documentado en changelog
- [ ] Probado manualmente el flujo completo
```

---

## Checklist antes de lanzar

```
Producto:
[ ] Al menos 1 usuario real ha pagado
[ ] El flujo principal funciona de principio a fin
[ ] Hay un proceso de onboarding claro

Técnico:
[ ] 0 errores de TypeScript
[ ] Variables de entorno documentadas
[ ] Backups de DB configurados
[ ] Monitoreo de errores activo (Sentry)

Legal:
[ ] Términos y condiciones publicados
[ ] Política de privacidad (Habeas Data Colombia)
[ ] Política de reembolsos definida

Negocio:
[ ] Precios definidos y publicados
[ ] Método de pago funcionando
[ ] Proceso de soporte definido (WhatsApp/email)
```

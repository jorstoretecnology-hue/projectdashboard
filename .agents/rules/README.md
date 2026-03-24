# 📚 Índice de Reglas - Antigravity Rules

> **Versión**: 5.0.0
> **Última actualización**: 22 de marzo de 2026
> **Estado**: ✅ Completo y parametrizado

---

## 🎯 Propósito

Este directorio contiene **TODAS las reglas** que los agentes de Antigravity deben aplicar en tiempo real durante el desarrollo, code review, y deployment del proyecto Dashboard Universal SaaS.

---

## 📁 Estructura de Reglas

```
.agents/
├── onboarding.md                  # Protocolo de inicio/fin de sesión ⭐
└── rules/
    ├── reglas-basicas.md          # Reglas básicas parametrizadas (ESPAÑOL) ⭐
    ├── file-creation-rules.md     # Reglas para creación de archivos nuevos
    ├── code-review-rules.md       # Reglas para Code Review y PRs
    ├── ci-cd-rules.md             # Reglas para CI/CD y Security Pipeline
    ├── database-rules.md          # Reglas para base de datos y migraciones
    └── README.md                  # Este archivo (índice)
```

### Reglas Heredadas de Antigravity
```
.antigravity/rules/
├── security-rules.md              # Reglas de seguridad (OWASP, ISO 27001)
├── architecture-rules.md          # Reglas de arquitectura (multi-tenant, módulos)
└── code-rules.md                  # Reglas de código (TypeScript, React)
```

---

## 📋 Descripción de Reglas

### 1. `reglas-basicas.md` ⭐ (PRINCIPAL)

**Propósito**: Reglas básicas **OBLIGATORIAS** parametrizadas para todo el ciclo de desarrollo.

**Cobertura**:
- ✅ Seguridad (10 reglas: RLS, Zod, TypeScript, auth, logging, etc.)
- ✅ Arquitectura (5 reglas: estructura, módulos, multi-tenancy, roles, Server Components)
- ✅ Código (5 reglas: componentes, hooks, API routes, nomenclatura, utilidades)
- ✅ Testing (3 reglas: cobertura, seguridad, comandos)
- ✅ Documentación (2 reglas: JSDoc, comentarios)
- ✅ Ciclo de desarrollo (5 fases: planificación → commit)

**Severidad**:
| Nivel | Color | Acción | Ejemplos |
|-------|-------|--------|----------|
| CRÍTICA | 🔴 | Bloquear | `select('*')`, sin RLS, sin validación Zod |
| ALTA | 🟠 | Advertencia fuerte | `any`, sin error handling, console.log en prod |
| MEDIA | 🟡 | Sugerencia | Naming, formato, orden de imports |
| BAJA | 🟢 | Info | Comentarios, documentación |

**Cuándo aplicar**: **SIEMPRE** - Estas reglas se aplican en todo momento.

---

### 2. `file-creation-rules.md`

**Propósito**: Plantillas y estructuras obligatorias para crear nuevos archivos.

**Cobertura**:
- ✅ Componentes React (.tsx)
- ✅ Hooks custom (.ts)
- ✅ API routes (.ts)
- ✅ Server Actions (.ts)
- ✅ Servicios (.ts)
- ✅ Tipos TypeScript (.ts)
- ✅ Migraciones SQL (.sql)

**Checklist de creación**:
```bash
# Antes de crear
# ✅ El archivo es necesario (no hay duplicados)
# ✅ La ubicación sigue la estructura del proyecto
# ✅ El nombre sigue las convenciones

# Después de crear
# ✅ Imports organizados
# ✅ Tipos TypeScript explícitos
# ✅ Schema Zod para validación
# ✅ Error handling con try/catch
# ✅ Logger en lugar de console.log
```

**Cuándo aplicar**: Al crear **cualquier archivo nuevo** en el proyecto.

---

### 3. `code-review-rules.md`

**Propósito**: Checklist exhaustiva para revisión de código y pull requests.

**Cobertura**:
- ✅ Seguridad (CRÍTICO): Auth, RLS, validación, secrets, logging
- ✅ TypeScript (ALTO): Tipos, null safety, generics
- ✅ React/Next.js (ALTO): Componentes, hooks, Server Components
- ✅ Base de datos (ALTO): Queries, migraciones, performance
- ✅ Testing (ALTO): Cobertura, calidad, casos de borde
- ✅ Código (MEDIO): Limpieza, legibilidad, DRY, organización
- ✅ UI/UX (MEDIO): Accesibilidad, responsive, feedback
- ✅ Performance (MEDIO): Bundle size, runtime
- ✅ Documentación (MEDIO): JSDoc, comentarios, cambios

**Proceso de review**:
```
1. Pre-PR: npm run check, build, security:audit
2. Descripción del PR con checklist
3. Review por pares (≤24h)
4. Aprobación y merge
```

**Cuándo aplicar**: En **cada pull request** antes de mergear.

---

### 4. `ci-cd-rules.md`

**Propósito**: Reglas para el pipeline de CI/CD y validación de seguridad.

**Cobertura**:
- ✅ Security Pipeline (MD + JSON reports)
- ✅ Umbrales críticos (type errors, select star, RLS, vulns)
- ✅ Estructura del JSON report
- ✅ Validación automática (scripts)
- ✅ Fases del pipeline (pre-commit → post-deploy)
- ✅ Integración con herramientas (Sentry, Upstash, GitHub Security)
- ✅ Reportes y métricas (Security Score)
- ✅ Respuesta a incidentes (P0-P3)

**Umbrales críticos** (pipeline falla si excede):
| Hallazgo | Umbral | Severidad |
|----------|--------|-----------|
| Type errors | > 0 | 🔴 CRÍTICA |
| `any` types | > 0 | 🟠 ALTA |
| `select('*')` | > 0 | 🔴 CRÍTICA |
| Missing RLS | > 0 | 🔴 CRÍTICA |
| Vulnerabilidades críticas | > 0 | 🔴 CRÍTICA |
| Tests fallidos | > 0 | 🔴 CRÍTICA |

**Cuándo aplicar**: En **cada push** y **pre-deploy**.

---

### 5. `database-rules.md`

**Propósito**: Reglas para diseño de base de datos, migraciones y queries SQL.

**Cobertura**:
- ✅ Aislamiento multi-tenant (CRÍTICO)
- ✅ Índices de performance (ALTO)
- ✅ Soft delete (ALTO)
- ✅ Auditoría automática (ALTO)
- ✅ Validación de datos (MEDIO)
- ✅ Estructura de migraciones
- ✅ Funciones y RPCs
- ✅ Políticas RLS (plantillas)
- ✅ Queries seguras (patrones)
- ✅ Performance (optimización)
- ✅ Backup y recovery
- ✅ Monitoreo

**Regla de oro**: **Todas las tablas operativas DEBEN tener RLS**.

```sql
-- ✅ CORRECTO
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "table_tenant_isolation"
ON public.table_name FOR ALL
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());
```

**Cuándo aplicar**: Al crear/alterar **cualquier tabla o query SQL**.

---

## 🔗 Integración con Reglas Existentes

### Reglas de `.antigravity/rules/`

Las reglas en `.agents/rules/` **complementan y expanden** las reglas heredadas:

| Regla Heredada | Equivalente en `.agents/rules/` |
|----------------|---------------------------------|
| `security-rules.md` | `reglas-basicas.md` (Sección 1) + `database-rules.md` |
| `architecture-rules.md` | `reglas-basicas.md` (Sección 2) |
| `code-rules.md` | `reglas-basicas.md` (Sección 3) + `file-creation-rules.md` |

**Prioridad**: En caso de conflicto, las reglas en `.agents/rules/` tienen **precedencia** por ser más recientes y estar parametrizadas en español.

---

## 📊 Matriz de Aplicación

| Regla | Desarrollo | Code Review | CI/CD | DB Ops |
|-------|------------|-------------|-------|--------|
| `reglas-basicas.md` | ✅ | ✅ | ✅ | ✅ |
| `file-creation-rules.md` | ✅ | ✅ | ⚠️ | ⚠️ |
| `code-review-rules.md` | ⚠️ | ✅ | ✅ | ⚠️ |
| `ci-cd-rules.md` | ⚠️ | ✅ | ✅ | ⚠️ |
| `database-rules.md` | ⚠️ | ✅ | ⚠️ | ✅ |

✅ = Aplicación principal | ⚠️ = Aplicación secundaria

---

## 🚨 Niveles de Severidad

### Sistema Unificado

| Nivel | Color | Acción | Ejemplo |
|-------|-------|--------|---------|
| **CRÍTICA** | 🔴 | **BLOQUEAR** | `select('*')`, sin RLS, sin validación Zod, cross-tenant access |
| **ALTA** | 🟠 | **Advertencia fuerte** | `any`, console.log en prod, sin error handling |
| **MEDIA** | 🟡 | **Sugerencia** | Naming, formato, orden de imports, documentación |
| **BAJA** | 🟢 | **Info** | Comentarios, ejemplos, best practices |

---

## 🔄 Flujo de Trabajo con Reglas

### Desarrollo Activo

```
1. Usuario escribe código
        ↓
2. Antigravity aplica `reglas-basicas.md` en tiempo real
        ↓
3. Detecta violación de reglas
        ↓
4. Muestra advertencia/sugerencia con severidad
        ↓
5. Usuario corrige o ignora con justificación
```

### Code Review

```
1. Usuario crea PR
        ↓
2. Antigravity aplica `code-review-rules.md`
        ↓
3. Genera checklist de review
        ↓
4. Reviewer verifica cada punto
        ↓
5. Aprueba o solicita cambios
```

### CI/CD Pipeline

```
1. Push a main/develop
        ↓
2. GitHub Actions ejecuta validaciones
        ↓
3. `ci-cd-rules.md` define umbrales
        ↓
4. Security audit genera reporte JSON
        ↓
5. Pipeline falla si excede umbrales críticos
```

### Operaciones de DB

```
1. Usuario crea migración SQL
        ↓
2. Antigravity aplica `database-rules.md`
        ↓
3. Verifica RLS, índices, estructura
        ↓
4. Sugiere mejoras
        ↓
5. Usuario ejecuta en Supabase
```

---

## 📚 Documentación de Referencia

### Seguridad
- [SECURITY_QUICK_REFERENCE.md](../docs/security/SECURITY_QUICK_REFERENCE.md)
- [SECURITY_CHECKLIST.md](../docs/security/SECURITY_CHECKLIST.md)
- [SECURITY_PLAYBOOK_SaaS.md](../docs/security/SECURITY_PLAYBOOK_SaaS.md)

### Arquitectura
- [ARCHITECTURE_SUMMARY.md](../ARCHITECTURE_SUMMARY.md)
- [CONTEXTO_DEL_PROYECTO.md](../docs/CONTEXTO_DEL_PROYECTO.md)
- [technical/MODULE_BLUEPRINT.md](../docs/technical/MODULE_BLUEPRINT.md)

### Base de Datos
- [technical/DATABASE_SCHEMA.md](../docs/technical/DATABASE_SCHEMA.md)
- [technical/PERMISSIONS_MATRIX.md](../docs/technical/PERMISSIONS_MATRIX.md)

### Coordinación IA
- [ai-coordination/PROMPT_MAESTRO_COORDINACION.md](../docs/ai-coordination/PROMPT_MAESTRO_COORDINACION.md)
- [ai-coordination/PROMPT_ANTIGRAVITY.md](../docs/ai-coordination/PROMPT_ANTIGRAVITY.md)

---

## 🎓 Onboarding de Nuevos Agentes

Si un nuevo agente de IA se une al proyecto:

### Día 1: Fundamentos
1. **Leer** `../onboarding.md` (15 min) - Protocolo de inicio de sesión
2. **Leer** `reglas-basicas.md` (30 min)
3. **Entender** jerarquía de documentación (10 min)
4. **Practicar** con código existente (1h)

### Día 2: Especialización
1. **Seleccionar** área de enfoque (security, architecture, code)
2. **Estudiar** reglas específicas (2h)
3. **Aplicar** en código real (2h)

### Día 3: Integración
1. **Participar** en code review simulado (1h)
2. **Ejecutar** security audit (1h)
3. **Validar** conocimiento con checklist (1h)

---

## ✅ Checklist de Configuración

- [x] Reglas básicas parametrizadas (`reglas-basicas.md`)
- [x] Reglas de creación de archivos (`file-creation-rules.md`)
- [x] Reglas de code review (`code-review-rules.md`)
- [x] Reglas de CI/CD (`ci-cd-rules.md`)
- [x] Reglas de base de datos (`database-rules.md`)
- [x] Índice maestro (`README.md`)
- [x] Integración con reglas heredadas
- [x] Documentación de referencia vinculada

---

## 🔔 Actualizaciones

### Versión 5.0.0 (22 de marzo de 2026)

**Novedades**:
- ✅ Reglas parametrizadas en español
- ✅ Cobertura completa del ciclo de desarrollo
- ✅ Integración con Security Pipeline
- ✅ Matriz de aplicación definida
- ✅ Flujo de trabajo documentado

**Cambios desde 4.0.0**:
- 📝 Agregadas 5 reglas nuevas
- 🔗 Integración con documentación existente
- 🎯 Severidad unificada
- 📊 Métricas de calidad definidas

---

## 📞 Soporte

### Canales de Comunicación
- **GitHub Issues:** Bugs y mejoras de reglas
- **Slack Antigravity:** Canal #dashboard-universal
- **Email:** soporte@antigravity.com

### Horarios de Soporte
- **Lunes a Viernes:** 9:00 AM - 6:00 PM (Bogotá)
- **Sábados:** 9:00 AM - 1:00 PM (Bogotá)
- **Emergencias:** 24/7 vía Slack

---

**Fin del Índice de Reglas**

*¿Necesitas más detalles? Consulta la documentación específica en cada archivo de reglas o en `docs/`.*

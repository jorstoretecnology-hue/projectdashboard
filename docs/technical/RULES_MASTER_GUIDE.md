# 📚 Guía Maestra de Reglas - Dashboard Universal SaaS

> **Versión**: 5.0.0
> **Fecha**: 22 de marzo de 2026
> **Estado**: ✅ **COMPLETAMENTE PARAMETRIZADO**

---

## 🎯 Propósito

Esta es la **guía maestra** que consolida TODAS las reglas de desarrollo para el proyecto Dashboard Universal SaaS. Cubre **todas las fases del ciclo de desarrollo de software** incluyendo seguridad, siguiendo estándares internacionales (OWASP Top 10, ISO 27001, NIST CSF).

---

## 📁 Ubicación de Reglas

### Reglas Principales (`.agents/`)
| Archivo | Propósito | Cuándo Usar |
|---------|-----------|-------------|
| **[onboarding.md](.agents/onboarding.md)** ⭐ | Protocolo de inicio/fin de sesión | **CADA SESIÓN** |
| **[reglas-basicas.md](.agents/rules/reglas-basicas.md)** ⭐ | Reglas básicas parametrizadas (ESPAÑOL) | **SIEMPRE** - Desarrollo diario |
| **[file-creation-rules.md](.agents/rules/file-creation-rules.md)** | Plantillas para archivos nuevos | Al crear archivos |
| **[code-review-rules.md](.agents/rules/code-review-rules.md)** | Checklist para code reviews | En pull requests |
| **[ci-cd-rules.md](.agents/rules/ci-cd-rules.md)** | Pipeline de CI/CD y seguridad | En deploy/CI |
| **[database-rules.md](.agents/rules/database-rules.md)** | Reglas para base de datos SQL | En operaciones DB |
| **[rules/README.md](.agents/rules/README.md)** | Índice maestro de reglas | Como referencia |

### Reglas Heredadas (`.antigravity/rules/`)
| Archivo | Propósito |
|---------|-----------|
| [security-rules.md](.antigravity/rules/security-rules.md) | Seguridad (OWASP, ISO 27001) |
| [architecture-rules.md](.antigravity/rules/architecture-rules.md) | Arquitectura (multi-tenant, módulos) |
| [code-rules.md](.antigravity/rules/code-rules.md) | Código (TypeScript, React) |

---

## 🚀 Inicio Rápido

### Para Nuevos Desarrolladores (Humanos o IAs)

```
PASO 1: Leer contexto del proyecto (15 min)
  ├─ docs/CONTEXTO_DEL_PROYECTO.md
  ├─ ARCHITECTURE_SUMMARY.md
  └─ docs/PROGRESS_TRACKER.md

PASO 2: Entender reglas básicas (30 min)
  └─ .agents/rules/reglas-basicas.md

PASO 3: Aplicar en desarrollo diario
  ├─ Crear archivo → file-creation-rules.md
  ├─ Escribir código → reglas-basicas.md
  ├─ Code review → code-review-rules.md
  └─ Deploy → ci-cd-rules.md
```

---

## 📊 Resumen de Reglas por Categoría

### 1. Seguridad (10 Reglas Críticas)

| # | Regla | Severidad | Ejemplo |
|---|-------|-----------|---------|
| 1.1 | RLS Obligatorio | 🔴 CRÍTICA | `.eq('tenant_id', getRequiredTenantId())` |
| 1.2 | Prohibido select(*) | 🔴 CRÍTICA | `.select('id, name, email')` ✅ |
| 1.3 | Validación Zod | 🔴 CRÍTICA | `schema.parse(data)` |
| 1.4 | TypeScript estricto | 🟠 ALTA | No `any`, usar tipos |
| 1.5 | Server-Side Tenant | 🔴 CRÍTICA | Resolver en servidor |
| 1.6 | Gestión de Secretos | 🔴 CRÍTICA | `process.env` |
| 1.7 | Logging Seguro | 🟠 ALTA | `logger.info()`, no console.log |
| 1.8 | Autenticación | 🔴 CRÍTICA | `getUser()` en APIs |
| 1.9 | Dependency Injection | 🟠 ALTA | Supabase inyectado |
| 1.10 | Error Handling | 🟠 ALTA | try/catch con logging |

---

### 2. Arquitectura (5 Reglas)

| # | Regla | Severidad |
|---|-------|-----------|
| 2.1 | Estructura de Directorios | 🟡 MEDIA |
| 2.2 | Sistema de Módulos | 🟠 ALTA |
| 2.3 | Multi-Tenancy | 🔴 CRÍTICA |
| 2.4 | Sistema de Roles | 🔴 CRÍTICA |
| 2.5 | Server Components | 🟠 ALTA |

---

### 3. Código (5 Reglas)

| # | Regla | Severidad |
|---|-------|-----------|
| 3.1 | Componentes React | 🟠 ALTA |
| 3.2 | Hooks Custom | 🟠 ALTA |
| 3.3 | API Routes | 🔴 CRÍTICA |
| 3.4 | Nomenclatura | 🟡 MEDIA |
| 3.5 | Utilidades | 🟡 MEDIA |

---

### 4. Testing (3 Reglas)

| # | Regla | Severidad |
|---|-------|-----------|
| 4.1 | Cobertura | 🟠 ALTA |
| 4.2 | Tests de Seguridad | 🔴 CRÍTICA |
| 4.3 | Comandos | 🟡 MEDIA |

---

### 5. Documentación (2 Reglas)

| # | Regla | Severidad |
|---|-------|-----------|
| 5.1 | JSDoc | 🟡 MEDIA |
| 5.2 | Comentarios | 🟡 MEDIA |

---

### 6. Base de Datos (10 Reglas)

| # | Regla | Severidad |
|---|-------|-----------|
| A.1 | Aislamiento Multi-Tenant | 🔴 CRÍTICA |
| A.2 | Índices de Performance | 🟠 ALTA |
| A.3 | Soft Delete | 🟠 ALTA |
| A.4 | Auditoría Automática | 🟠 ALTA |
| A.5 | Validación de Datos | 🟡 MEDIA |
| A.6 | Estructura de Migraciones | 🟠 ALTA |
| A.7 | Funciones y RPCs | 🟠 ALTA |
| A.8 | Políticas RLS | 🔴 CRÍTICA |
| A.9 | Queries Seguras | 🟠 ALTA |
| A.10 | Performance | 🟡 MEDIA |

---

## 🔄 Flujo de Trabajo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PLANIFICACIÓN                                            │
│    ├─ Leer docs/PROGRESS_TRACKER.md                        │
│    ├─ Identificar tarea en docs/ROADMAP                    │
│    └─ Consultar docs específicos                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. IMPLEMENTACIÓN                                           │
│    ├─ Archivo nuevo → file-creation-rules.md               │
│    ├─ Código → reglas-basicas.md (seguridad + código)      │
│    └─ DB → database-rules.md                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TESTING                                                  │
│    ├─ Tests unitarios                                      │
│    ├─ Tests de seguridad (cross-tenant, SQL injection)     │
│    └─ npm test                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CODE REVIEW                                              │
│    ├─ code-review-rules.md (checklist completa)            │
│    ├─ npm run check (type-check + lint + test)             │
│    └─ npm run build                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CI/CD                                                    │
│    ├─ ci-cd-rules.md (umbrales de pipeline)                │
│    ├─ npm run security:audit                               │
│    └─ npm run security:validate                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. DEPLOY                                                   │
│    ├─ Checklist pre-deploy                                 │
│    ├─ Deploy staging → production                          │
│    └─ Monitoreo post-deploy                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. OPERACIONES                                              │
│    ├─ database-rules.md (monitoreo, backup, purga)         │
│    └─ Respuesta a incidentes (P0-P3)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Sistema de Severidad

| Nivel | Color | Acción | Ejemplos | Consecuencia |
|-------|-------|--------|----------|--------------|
| **CRÍTICA** | 🔴 | **BLOQUEAR** | select(*), sin RLS, sin Zod | ❌ Pipeline falla |
| **ALTA** | 🟠 | **Advertencia fuerte** | any, console.log | ⚠️ Requiere justificación |
| **MEDIA** | 🟡 | **Sugerencia** | Naming, formato | 💡 Mejorar cuando sea posible |
| **BAJA** | 🟢 | **Info** | Comentarios, ejemplos | 📚 Opcional |

---

## 📋 Checklists Esenciales

### Checklist Pre-Commit

```bash
# Código
# ✅ No dejé console.log (usar logger.ts)
# ✅ No usé any (usar tipos o unknown)
# ✅ No hice select(*) (campos explícitos)
# ✅ Validé inputs con Zod
# ✅ Respété RLS (tenant_id en queries)

# Seguridad
# ✅ Verifiqué autenticación con getUser()
# ✅ Verifiqué permisos por rol
# ✅ No expuse datos sensibles
# ✅ No hardcodeé secrets

# Testing
# ✅ npm test pasa
# ✅ Agregué tests para nueva funcionalidad
# ✅ Coverage no disminuyó

# Calidad
# ✅ npm run lint pasa
# ✅ npm run format aplicado
# ✅ npm run type-check pasa
# ✅ npm run build pasa
```

### Checklist Pre-Deploy

```bash
# Validaciones automáticas
# ✅ npm run check (type-check + lint + test)
# ✅ npm run build (sin errores)
# ✅ npm run security:audit (sin hallazgos críticos)
# ✅ npm run security:validate (umbrales passing)

# Validaciones manuales
# ✅ Migraciones probadas en staging
# ✅ Feature flags configurados
# ✅ Variables de entorno actualizadas
# ✅ Backups verificados
```

---

## 📊 Métricas de Calidad

### Security Score (Meta: 100%)

```typescript
interface SecurityScore {
  rlsCoverage: number           // Meta: 100%
  selectStarCount: number       // Meta: 0
  anyTypeCount: number          // Meta: 0 (actual: 64)
  zodValidationCoverage: number // Meta: 100%
  tenantIsolationScore: number  // Meta: 100%
}
```

### Code Quality Score (Meta: ≥90%)

```typescript
interface CodeQualityScore {
  typeSafety: number      // Meta: 100%
  errorHandling: number   // Meta: 100%
  testCoverage: number    // Meta: ≥80%
  documentation: number   // Meta: ≥90%
}
```

---

## 🔗 Documentación de Referencia

### Seguridad
- [SECURITY_QUICK_REFERENCE.md](docs/security/SECURITY_QUICK_REFERENCE.md)
- [SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md)
- [SECURITY_PLAYBOOK_SaaS.md](docs/security/SECURITY_PLAYBOOK_SaaS.md)

### Arquitectura
- [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)
- [CONTEXTO_DEL_PROYECTO.md](docs/CONTEXTO_DEL_PROYECTO.md)
- [technical/MODULE_BLUEPRINT.md](docs/technical/MODULE_BLUEPRINT.md)

### Base de Datos
- [technical/DATABASE_SCHEMA.md](docs/technical/DATABASE_SCHEMA.md)
- [technical/PERMISSIONS_MATRIX.md](docs/technical/PERMISSIONS_MATRIX.md)

### Coordinación IA
- [ai-coordination/PROMPT_MAESTRO_COORDINACION.md](docs/ai-coordination/PROMPT_MAESTRO_COORDINACION.md)
- [ai-coordination/PROMPT_ANTIGRAVITY.md](docs/ai-coordination/PROMPT_ANTIGRAVITY.md)

### Operations
- [PROGRESS_TRACKER.md](docs/PROGRESS_TRACKER.md)
- [IMPLEMENTATION_ROADMAP.md](docs/strategy/IMPLEMENTATION_ROADMAP.md)

---

## 🎓 Onboarding

### Día 1: Fundamentos
1. Leer `docs/CONTEXTO_DEL_PROYECTO.md` (15 min)
2. Leer `.agents/rules/reglas-basicas.md` (30 min)
3. Practicar con código existente (1h)

### Día 2: Especialización
1. Seleccionar área (security, architecture, code)
2. Estudiar reglas específicas (2h)
3. Aplicar en código real (2h)

### Día 3: Integración
1. Participar en code review simulado (1h)
2. Ejecutar security audit (1h)
3. Validar conocimiento con checklist (1h)

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

## 📈 Estado de Parametrización

| Categoría | Estado | Progreso |
|-----------|--------|----------|
| **Reglas Básicas** | ✅ COMPLETADO | 100% |
| **File Creation** | ✅ COMPLETADO | 100% |
| **Code Review** | ✅ COMPLETADO | 100% |
| **CI/CD** | ✅ COMPLETADO | 100% |
| **Database** | ✅ COMPLETADO | 100% |
| **Índice Maestro** | ✅ COMPLETADO | 100% |
| **Integración** | ✅ COMPLETADO | 100% |

**Total**: 25+ reglas parametrizadas en 6 archivos principales

---

## 🏆 Estándares de Cumplimiento

Este proyecto cumple con:
- ✅ **OWASP Top 10** (Todos los puntos)
- ✅ **ISO/IEC 27001:2022** (Controles de seguridad)
- ✅ **NIST Cybersecurity Framework** (ID.PROTECT, DETECT, RESPOND)
- ✅ **Cloud Security Alliance** (Multi-tenancy seguro)
- ✅ **DevSecOps** (Shift-left security)
- ✅ **TypeScript Best Practices** (Strict mode)
- ✅ **React/Next.js Best Practices** (Server Components)

---

**🎉 PARAMETRIZACIÓN COMPLETADA EXITOSAMENTE**

*Todas las reglas necesarias han sido parametrizadas y documentadas. El sistema está listo para aplicarse en todas las fases del ciclo de desarrollo.*

---

**Última actualización**: 22 de marzo de 2026
**Versión**: 5.0.0
**Mantenedor**: Equipo de Desarrollo + IAs de Antigravity

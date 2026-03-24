# 🔐 Security Pipeline - Validación Estructurada con JSON

## 📋 Descripción

Este sistema implementa un **pipeline de seguridad con validación estructurada** usando salidas duales:
- **Markdown (.md)**: Reporte legible para humanos
- **JSON (.json)**: Validación automática en CI/CD

## 🎯 Beneficios

| Ventaja | Descripción |
|---------|-------------|
| ✅ **Menos frágil** | No depende de strings exactos en markdown |
| ✅ **Escalable** | Nuevas métricas se agregan sin romper el pipeline |
| ✅ **Automatizable** | Agentes de Antigravity pueden consumir el JSON en runtime |
| ✅ **Auditable** | JSON como fuente de verdad para dashboards |

## 🚀 Uso Local

### Opción 1: Comandos npm (Recomendado)

```bash
# 1. Ejecutar auditoría completa
npm run security:audit

# 2. Validar el reporte generado
npm run security:validate
```

### Opción 2: Scripts directos

**Cross-platform (recomendado):**
```bash
# Ejecutar auditoría
qwen --prompt docs/SECURITY_AUDIT_PROMPT.md \
     --output docs/SECURITY_PIPELINE_$(date +'%Y%m%d').md \
     --output-json docs/SECURITY_PIPELINE_$(date +'%Y%m%d').json

# Validar reporte (automático detecta el más reciente)
node scripts/validate-security-report.js

# O especificar un archivo concreto
node scripts/validate-security-report.js docs/SECURITY_PIPELINE_20260318.json
```

## 📊 Estructura del JSON Report

```json
{
  "date": "2026-03-18",
  "commit": "abc123",
  "status": "pass|fail|with_observations",
  "errors": {
    "typeErrors": 0,
    "anyTypes": 0,
    "consoleLogs": 0,
    "selectStarQueries": 0,
    "missingRls": 0,
    "missingZodValidation": 0,
    "hardcodedSecrets": 0
  },
  "tests": {
    "passed": 22,
    "failed": 0,
    "coverage": 60
  },
  "dependencies": {
    "critical": 0,
    "high": 0,
    "moderate": 2,
    "low": 5,
    "total": 7
  },
  "findings": [...],
  "recommendations": [...]
}
```

## 🚨 Gatekeeper de Seguridad (CI/CD)

El pipeline en GitHub Actions falla automáticamente si detecta:

| Hallazgo | Umbral | Severidad | Acción |
|----------|--------|-----------|--------|
| Errores de tipo | `> 0` | CRÍTICA | ❌ Bloquea deploy |
| Tipos `any` | `> 0` | ALTA | ❌ Bloquea deploy |
| `console.log` | `> 0` | ALTA | ❌ Bloquea deploy |
| `select(*)` queries | `> 0` | CRÍTICA | ❌ Bloquea deploy |
| Missing RLS | `> 0` | CRÍTICA | ❌ Bloquea deploy |
| Vulnerabilidades críticas | `> 0` | CRÍTICA | ❌ Bloquea deploy |
| Vulnerabilidades altas | `> 0` | ALTA | ❌ Bloquea deploy |
| Tests fallidos | `> 0` | CRÍTICA | ❌ Bloquea deploy |

## 📁 Archivos del Sistema

| Archivo | Propósito |
|---------|-----------|
| `docs/SECURITY_AUDIT_PROMPT.md` | Prompt especializado para Qwen CLI |
| `docs/SECURITY_QUICK_REFERENCE.md` | Guía de referencia con sección DevSecOps actualizada |
| `.github/workflows/ci.yml` | Workflow de CI/CD con validación JSON |
| `scripts/validate-security-report.sh` | Script de validación para Linux/macOS |
| `scripts/validate-security-report.bat` | Script de validación para Windows |
| `docs/SECURITY_PIPELINE_*.md` | Reportes legibles para humanos |
| `docs/SECURITY_PIPELINE_*.json` | Reportes estructurados para CI/CD |

## 🔧 Configuración Requerida

El script de validación usa **Node.js** (ya instalado en el proyecto), no requiere dependencias adicionales.

**Opcional - Scripts bash para Linux/macOS:**
Si prefieres los scripts bash originales, necesitas `jq`:

**macOS:**
```bash
brew install jq
```

**Ubuntu/Debian:**
```bash
sudo apt-get install jq
```

**Windows (Chocolatey):**
```cmd
choco install jq
```

**Windows (winget):**
```cmd
winget install jqlang.jq
```

## 📈 Ejemplo de Salida

### ✅ Auditoría Aprobada
```
🔍 Validando reporte: docs/SECURITY_PIPELINE_20260318.json

✅ Sin errores de tipo
✅ Sin tipos 'any'
✅ Sin console.log
✅ Sin select(*) queries
✅ Todas las queries tienen RLS
✅ Sin vulnerabilidades críticas
✅ Sin vulnerabilidades altas
✅ Todos los tests pasan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AUDITORÍA APROBADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Resumen:
{
  "status": "pass",
  "tests": {
    "passed": 22,
    "failed": 0,
    "coverage": 60
  },
  "dependencies": {
    "total": 7,
    "critical": 0,
    "high": 0
  }
}
```

### ❌ Auditoría Rechazada
```
🔍 Validando reporte: docs/SECURITY_PIPELINE_20260318.json

❌ Errores de tipo: 3
❌ console.log: 2
❌ Vulnerabilidades altas: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ AUDITORÍA RECHAZADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hallazgos críticos: 3

📊 Métricas completas:
{ ... }
```

## 🤖 Integración con Antigravity Agents

Los agentes de Antigravity pueden consumir el JSON para:

1. **Monitoreo en runtime**: Leer el último JSON y aplicar reglas
2. **Alertas automáticas**: Detectar cambios en métricas clave
3. **Dashboards**: Visualizar tendencias de seguridad
4. **Auto-remediación**: Trigger de fixes automáticos

```javascript
// Ejemplo: Leer reporte desde Antigravity Agent
const report = await fs.readFile('docs/SECURITY_PIPELINE_latest.json', 'utf8');
const metrics = JSON.parse(report);

if (metrics.errors.selectStarQueries > 0) {
  // Trigger: Bloquear queries sin columnas explícitas
  await securityEngine.enforceExplicitColumns();
}
```

## 📝 Flujo de Trabajo Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. Developer hace push/PR                               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 2. GitHub Actions ejecuta: npm run check                │
│    - type-check                                          │
│    - lint                                                │
│    - test                                                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Qwen CLI ejecuta auditoría de seguridad              │
│    - Genera SECURITY_PIPELINE_YYYYMMDD.md              │
│    - Genera SECURITY_PIPELINE_YYYYMMDD.json            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Validación con jq lee el JSON                        │
│    - Verifica umbral de cada métrica                   │
│    - FALLA si hay hallazgos críticos                   │
└─────────────────────────────────────────────────────────┘
                           ↓
                    ┌──────────────┐
                    │   ¿PASS?     │
                    └──────────────┘
                     ↓            ↓
                   SÍ            NO
                     ↓            ↓
        ┌─────────────────┐  ┌─────────────────┐
        │ ✅ Deploy       │  │ ❌ Bloqueado    │
        │ 📊 Artifacts    │  │ 📋 Ver reporte  │
        │ 📢 Notificación │  │ 🔧 Fix required │
        └─────────────────┘  └─────────────────┘
```

## 🎯 Mejores Prácticas

1. **Ejecutar localmente antes de push**: `npm run security:audit && npm run security:validate`
2. **Revisar el .md para contexto**: El JSON dice "qué", el MD dice "por qué"
3. **Mantener umbrales en cero**: Cualquier hallazgo crítico debe fixearse inmediatamente
4. **Usar findings del JSON**: Los paths y líneas exactas están en `report.findings[]`
5. **Automatizar notificaciones**: Integrar el JSON con Slack/Teams para alertas

## 📞 Soporte

Para issues con el pipeline:
1. Revisar logs de GitHub Actions
2. Ejecutar validación local: `npm run security:validate`
3. Verificar que el JSON tenga la estructura correcta
4. Consultar `docs/SECURITY_QUICK_REFERENCE.md`

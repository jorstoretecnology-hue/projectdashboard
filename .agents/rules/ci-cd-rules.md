---
trigger: on_push
glob: "**/*"
description: Reglas para CI/CD Pipeline y Security Validation
---

# 🚀 Reglas para CI/CD Pipeline y Security Validation

## Pipeline de Seguridad

### Visión General

El pipeline de seguridad utiliza **salida dual** para maximizar robustez y legibilidad:

| Formato | Propósito | Ubicación |
|---------|-----------|-----------|
| **Markdown (.md)** | Reporte legible para humanos | `docs/security/reports/SECURITY_PIPELINE_YYYYMMDD.md` |
| **JSON (.json)** | Validación automática en CI/CD | `docs/security/reports/SECURITY_PIPELINE_YYYYMMDD.json` |

---

## Comandos de Ejecución

### Local

```bash
# Ejecutar auditoría completa con Qwen CLI
npm run security:audit    # Genera reporte MD + JSON

# Validar reporte JSON
npm run security:validate # Valida umbrales críticos

# Verificación completa pre-deploy
npm run check             # type-check + lint + test
npm run build             # build de producción
npm run security:audit    # auditoría de seguridad
npm run security:validate # validación de umbrales
```

### CI/CD (GitHub Actions)

```yaml
name: Security Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-audit:
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
        
      - name: Validate security report
        run: npm run security:validate
        
      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: docs/security/reports/
```

---

## Umbrales Críticos

El pipeline **FALLA** automáticamente si detecta:

| Hallazgo | Umbral | Severidad | Acción |
|----------|--------|-----------|--------|
| Type errors | `> 0` | 🔴 CRÍTICA | ❌ Fallar build |
| `any` types | `> 0` | 🟠 ALTA | ⚠️ Advertir (meta: 0) |
| `console.log` en prod | `> 0` | 🟠 ALTA | ⚠️ Advertir |
| `select('*')` | `> 0` | 🔴 CRÍTICA | ❌ Fallar build |
| Missing RLS | `> 0` | 🔴 CRÍTICA | ❌ Fallar build |
| Vulnerabilidades críticas | `> 0` | 🔴 CRÍTICA | ❌ Fallar build |
| Vulnerabilidades altas | `> 0` | 🟠 ALTA | ❌ Fallar build |
| Tests fallidos | `> 0` | 🔴 CRÍTICA | ❌ Fallar build |
| Coverage < 80% | `true` | 🟡 MEDIA | ⚠️ Advertir |

---

## Estructura del JSON Report

```json
{
  "timestamp": "2026-03-22T10:30:00.000Z",
  "version": "5.0.0",
  "status": "pass|fail|with_observations",
  
  "errors": {
    "typeErrors": 0,
    "anyTypes": 64,
    "consoleLogs": 42,
    "selectStarQueries": 21,
    "missingRls": 0,
    "crossTenantRisks": 0
  },
  
  "tests": {
    "passed": 150,
    "failed": 0,
    "skipped": 5,
    "coverage": {
      "overall": 65.2,
      "critical": 82.5,
      "byModule": {
        "customers": 85.0,
        "inventory": 78.3,
        "sales": 72.1,
        "auth": 90.2
      }
    }
  },
  
  "dependencies": {
    "total": 156,
    "outdated": 12,
    "vulnerabilities": {
      "critical": 0,
      "high": 0,
      "moderate": 3,
      "low": 5
    }
  },
  
  "security": {
    "rlsCoverage": 100,
    "zodValidationCoverage": 95.5,
    "tenantIsolationScore": 100,
    "authCoverage": 100,
    "loggingCompliance": 88.5
  },
  
  "codeQuality": {
    "typeSafety": 98.5,
    "errorHandling": 95.0,
    "documentation": 85.0,
    "deadCode": 45,
    "unusedImports": 12
  },
  
  "recommendations": [
    {
      "priority": "high",
      "category": "security",
      "issue": "64 tipos 'any' restantes",
      "files": ["src/app/dashboard/page.tsx", "src/providers/TenantGuard.tsx"],
      "action": "Reemplazar con tipos explícitos o unknown"
    },
    {
      "priority": "high",
      "category": "security",
      "issue": "42 console.log en producción",
      "files": ["src/modules/auth/actions.ts", "src/app/onboarding/page.tsx"],
      "action": "Reemplazar con logger.ts"
    },
    {
      "priority": "medium",
      "category": "performance",
      "issue": "21 queries con select('*')",
      "files": ["src/hooks/useCustomers.ts", "src/lib/api/customers.ts"],
      "action": "Especificar campos explícitamente"
    }
  ],
  
  "summary": {
    "totalIssues": 142,
    "criticalIssues": 0,
    "highIssues": 106,
    "mediumIssues": 36,
    "lowIssues": 0,
    "passedThresholds": 6,
    "failedThresholds": 0
  }
}
```

---

## Validación Automática

### Script de Validación

```javascript
// scripts/validate-security-report.js
const fs = require('fs');
const path = require('path');

const THRESHOLDS = {
  typeErrors: 0,
  selectStarQueries: 0,
  missingRls: 0,
  criticalVulnerabilities: 0,
  highVulnerabilities: 0,
  failedTests: 0,
};

const WARNINGS = {
  anyTypes: 0,
  consoleLogs: 0,
  coverage: 80,
};

function validate() {
  const reportPath = path.join(__dirname, '../docs/security/reports/SECURITY_PIPELINE_LATEST.json');
  
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Security report not found');
    process.exit(1);
  }
  
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  let hasErrors = false;
  let hasWarnings = false;
  
  // Validate critical thresholds
  Object.entries(THRESHOLDS).forEach(([key, threshold]) => {
    const value = report.errors?.[key] ?? report.dependencies?.vulnerabilities?.[key] ?? report.tests?.[key] ?? 0;
    if (value > threshold) {
      console.error(`❌ ${key}: ${value} (threshold: ${threshold})`);
      hasErrors = true;
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  });
  
  // Validate warnings
  Object.entries(WARNINGS).forEach(([key, threshold]) => {
    const value = report.errors?.[key] ?? report.codeQuality?.[key] ?? report.tests?.coverage?.overall ?? 0;
    const isCoverage = key === 'coverage';
    const failed = isCoverage ? value < threshold : value > threshold;
    
    if (failed) {
      console.warn(`⚠️ ${key}: ${value} (warning threshold: ${threshold})`);
      hasWarnings = true;
    }
  });
  
  if (hasErrors) {
    console.error('\n❌ Security validation FAILED');
    process.exit(1);
  }
  
  if (hasWarnings) {
    console.warn('\n⚠️ Security validation passed with warnings');
  } else {
    console.log('\n✅ Security validation PASSED');
  }
  
  process.exit(0);
}

validate();
```

---

## Fases del Pipeline

### Fase 1: Pre-Commit (Husky)

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,scss}": [
      "prettier --write"
    ]
  }
}
```

**Validaciones:**
- [ ] ESLint sin errores
- [ ] Prettier aplicado
- [ ] No hay `console.log` nuevos
- [ ] No hay `any` nuevos

---

### Fase 2: CI Pipeline

**Validaciones automáticas:**
```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Tests
npm test

# 4. Build
npm run build

# 5. Security audit
npm run security:audit

# 6. Dependency audit
npm audit --audit-level=high
```

---

### Fase 3: Security Validation

**Validación de umbrales:**
```bash
npm run security:validate
```

**Checklist manual:**
- [ ] RLS en todas las tablas nuevas
- [ ] Validación Zod en nuevos endpoints
- [ ] Tests de seguridad agregados
- [ ] Documentación actualizada

---

### Fase 4: Deploy

**Requisitos para deploy:**
- [ ] Pipeline passing (todos los checks ✅)
- [ ] Security validation passing
- [ ] ≥1 aprobación de reviewer
- [ ] CHANGELOG actualizado
- [ ] Migraciones probadas en staging

**Estrategia de deploy:**
```bash
# 1. Deploy a staging
npm run deploy:staging

# 2. Pruebas E2E en staging
npm run test:e2e

# 3. Deploy a producción (si staging pasa)
npm run deploy:production

# 4. Health checks post-deploy
npm run health:check
```

---

### Fase 5: Post-Deploy

**Monitoreo continuo:**
```bash
# Verificar errores en Sentry
# Verificar logs de aplicación
# Verificar métricas de performance
# Verificar tasa de errores
```

**Alertas configuradas:**
- Errores > 1% de requests
- Latencia p95 > 500ms
- Tasa de errores de auth > 5%
- Intentos de cross-tenant access

---

## Integración con Herramientas

### Sentry (Error Tracking)

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  beforeSend(event, hint) {
    // No enviar errores con PII
    if (event.request?.data?.password) {
      return null
    }
    return event
  },
})
```

---

### Upstash Redis (Rate Limiting)

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 intentos por 15 min
  analytics: true,
  prefix: '@ratelimit:auth',
})

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests por min
  analytics: true,
  prefix: '@ratelimit:api',
})
```

---

### GitHub Security

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "security"
      - "dependencies"

# .github/security.yml
name: Security Scanning

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          
      - name: Run CodeQL
        uses: github/codeql-action/analyze@v2
```

---

## Reportes y Métricas

### Security Score Dashboard

```typescript
interface SecurityScore {
  // Protección de datos
  rlsCoverage: number           // Meta: 100%
  tenantIsolationScore: number  // Meta: 100%
  
  // Validación
  zodValidationCoverage: number // Meta: 100%
  inputSanitization: number     // Meta: 100%
  
  // Autenticación
  authCoverage: number          // Meta: 100%
  mfaEnforcement: number        // Meta: 100%
  
  // Logging
  loggingCompliance: number     // Meta: 100%
  piiProtection: number         // Meta: 100%
  
  // Código
  typeSafety: number            // Meta: 100%
  errorHandling: number         // Meta: 100%
  
  // Tests
  testCoverage: number          // Meta: ≥80%
  securityTestCoverage: number  // Meta: ≥90%
}
```

### Trending Metrics

```typescript
interface SecurityTrends {
  week: string
  score: number
  incidents: number
  vulnerabilities: {
    critical: number
    high: number
    moderate: number
    low: number
  }
  improvements: string[]
  regressions: string[]
}
```

---

## Respuesta a Incidentes

### Niveles de Severidad

| Nivel | Color | Ejemplo | Tiempo de Respuesta |
|-------|-------|---------|---------------------|
| P0 | 🔴 | Cross-tenant data leak | Inmediato (<15 min) |
| P1 | 🟠 | Auth bypass | <1 hora |
| P2 | 🟡 | Rate limit bypass | <4 horas |
| P3 | 🟢 | Logging gap | <24 horas |

### Proceso de Respuesta

```
1. Detección
   ├─ Alertas automáticas (Sentry, logs)
   ├─ Reporte de usuario
   └─ Auditoría rutinaria
   
2. Contención (0-1h)
   ├─ Revocar tokens comprometidos
   ├─ Bloquear IPs sospechosas
   ├─ Rotar API keys
   
3. Investigación (1-4h)
   ├─ Revisar audit logs
   ├─ Identificar scope
   └─ Determinar causa raíz
   
4. Remediación (1-24h)
   ├─ Patchear vulnerabilidad
   ├─ Forzar reset de contraseñas
   └─ Actualizar documentación
   
5. Post-Mortem (1-7 días)
   ├─ Documentar incidente
   ├─ Identificar mejoras
   └─ Implementar prevención
```

---

## Checklist de Deploy

### Pre-Deploy

```bash
# Validaciones automáticas
npm run check              # ✅ type-check + lint + test
npm run build              # ✅ build sin errores
npm run security:audit     # ✅ audit sin hallazgos críticos
npm run security:validate  # ✅ umbrales passing

# Validaciones manuales
# ✅ Migraciones probadas en staging
# ✅ Feature flags configurados
# ✅ Variables de entorno actualizadas
# ✅ Backups verificados
```

### Deploy

```bash
# 1. Deploy a staging
npm run deploy:staging

# 2. Pruebas E2E
npm run test:e2e

# 3. Health checks
curl https://staging.example.com/health
# Expected: {"status":"ok","timestamp":"..."}

# 4. Deploy a producción (si staging pasa)
npm run deploy:production

# 5. Verificar deploy
curl https://api.example.com/health
```

### Post-Deploy

```bash
# Monitoreo (primeras 24h)
# ✅ Error rate < 1%
# ✅ Latencia p95 < 500ms
# ✅ Sin alertas de seguridad
# ✅ Métricas de negocio estables

# Documentación
# ✅ CHANGELOG actualizado
# ✅ Release notes publicadas
# ✅ Equipo notificado
```

---

## Referencias

- [SECURITY_QUICK_REFERENCE.md](../docs/security/SECURITY_QUICK_REFERENCE.md)
- [SECURITY_CHECKLIST.md](../docs/security/SECURITY_CHECKLIST.md)
- [SECURITY_PLAYBOOK_SaaS.md](../docs/security/SECURITY_PLAYBOOK_SaaS.md)
- [PROMPT_MAESTRO_COORDINACION.md](../docs/ai-coordination/PROMPT_MAESTRO_COORDINACION.md)

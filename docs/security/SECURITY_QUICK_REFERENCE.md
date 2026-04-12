# 🔐 Security Quick Reference – SaaS Multi-Tenant

## 📌 Objetivo

Guía rápida de seguridad para el proyecto SaaS, basada en:

- **ISO/IEC 27001:2022**
- **NIST Cybersecurity Framework (CSF)**
- **Cloud Security Alliance (CSA)**
- **OWASP Top 10**
- **DevSecOps + Xygeni**
- **Zscaler / Palo Alto Networks**
- **Vanta / AppOmni**

---

## 🧑💻 Desarrollo Seguro

- MFA obligatorio en login y paneles críticos.
- Validación de inputs con **Zod**.
- Queries con **RLS** (JWT-first, sin queries a `profiles`) y parametrizadas.
- Prohibido `select('*')` en queries de base de datos.
- TypeScript estricto (prohibido `any`).
- Gestión de secretos en **Vault / Secrets Manager / Vercel Env**.
- **Inmunidad Operativa**: Bloqueo automático via `useSubscriptionGuard`.

---

## 🛡️ OWASP Top 10 (Aplicado)

1. **Access Control** → RBAC + RLS.
2. **Cryptography** → TLS 1.3, AES-256.
3. **Injection** → Queries parametrizadas.
4. **Insecure Design** → Threat modeling.
5. **Misconfiguration** → Hardening automático.
6. **Vulnerable Components** → Escaneo continuo.
7. **Auth Failures** → MFA + OAuth tokens validados.
8. **Integrity Failures** → Firmar migraciones.
9. **Logging Failures** → Logs centralizados + alertas.
10. **SSRF** → Validar URLs externas.

---

## ⚙️ DevSecOps Pipeline

### CI/CD con Validación Estructurada

El pipeline de seguridad utiliza **salida dual** para maximizar robustez y legibilidad:

| Formato            | Propósito                      | Ubicación                              |
| ------------------ | ------------------------------ | -------------------------------------- |
| **Markdown (.md)** | Reporte legible para humanos   | `docs/SECURITY_PIPELINE_YYYYMMDD.md`   |
| **JSON (.json)**   | Validación automática en CI/CD | `docs/SECURITY_PIPELINE_YYYYMMDD.json` |

### Ejecución Local

```bash
# Ejecutar auditoría completa con Qwen CLI
qwen --prompt docs/SECURITY_AUDIT_PROMPT.md \
     --output docs/SECURITY_PIPELINE_$(date +'%Y%m%d').md \
     --output-json docs/SECURITY_PIPELINE_$(date +'%Y%m%d').json
```

### Validación en GitHub Actions

El pipeline falla automáticamente si detecta:

| Hallazgo                  | Umbral | Severidad |
| ------------------------- | ------ | --------- |
| Errores de tipo           | `> 0`  | CRÍTICA   |
| Tipos `any`               | `> 0`  | ALTA      |
| `console.log`             | `> 0`  | ALTA      |
| `select(*)` queries       | `> 0`  | CRÍTICA   |
| Missing RLS               | `> 0`  | CRÍTICA   |
| Vulnerabilidades críticas | `> 0`  | CRÍTICA   |
| Vulnerabilidades altas    | `> 0`  | ALTA      |
| Tests fallidos            | `> 0`  | CRÍTICA   |

### Estructura del JSON Report

```json
{
  "status": "pass|fail|with_observations",
  "errors": {
    "typeErrors": 0,
    "anyTypes": 0,
    "consoleLogs": 0,
    "selectStarQueries": 0,
    "missingRls": 0
  },
  "tests": {
    "passed": 0,
    "failed": 0,
    "coverage": 0
  },
  "dependencies": {
    "critical": 0,
    "high": 0,
    "total": 0
  }
}
```

### Beneficios de la Validación Estructurada

- ✅ **Menos frágil**: No depende de strings exactos en markdown
- ✅ **Escalable**: Nuevas métricas se agregan sin romper el pipeline
- ✅ **Automatizable**: Agentes de Antigravity pueden consumir el JSON en runtime
- ✅ **Auditable**: JSON como fuente de verdad para dashboards

### Otros Componentes del Pipeline

- **CI/CD**: SAST + DAST + escaneo de dependencias.
- **IaC scanning**: validar Terraform/Kubernetes.
- **Políticas automatizadas**: bloquear `console.log`, `select('*')`.
- **Supply Chain Security (Xygeni)**: detección de dependencias maliciosas.

---

## 🌐 Seguridad de Red

- **Zero Trust**: autenticación en cada servicio.
- **Segmentación de tráfico**: aislamiento de entornos.
- **WAF + IDS/IPS**: protección contra ataques web.
- **Threat Intelligence**: integración de feeds (Zscaler/Palo Alto).

---

## 📊 Auditoría y Cumplimiento

- **Logs centralizados** con acceso limitado.
- **Alertas en tiempo real**: intentos de login sospechosos.
- **Pentesting continuo**: automatizado y manual.
- **Cumplimiento**: ISO 27001, NIST CSF, CSA STAR, GDPR/CCPA.

---

## ✅ Checklist Rápido

- [ ] MFA activo.
- [ ] Validación Zod en inputs.
- [ ] RLS en todas las queries.
- [ ] Escaneo de dependencias en cada build.
- [ ] Auditoría de roles trimestral.
- [ ] Logs centralizados + alertas.
- [ ] Gestión segura de secretos.
- [ ] Pentesting automatizado y manual.
- [ ] Cumplimiento OWASP Top 10.
- [ ] Supply chain security con Xygeni.

---

---

## 🛡️ Aislamiento de Negocio (Multi-tenancy)

### Regla de Oro RLS (v6.1.0)

Toda política de seguridad debe validar el acceso mediante el JWT del usuario de forma atómica:

```sql
USING (tenant_id = get_current_user_tenant_id()) -- ✅ JWT-First
```

> [!CAUTION]
> Queda prohibido el uso de sub-consultas a `profiles` dentro de políticas RLS por impacto crítico en performance.

### Inmunidad Operativa

El sistema implementa un "Kill Switch" financiero:

1. **Detección**: `TenantContext` monitorea el estado `past_due` o `suspended`.
2. **Protección**: `useSubscriptionGuard` bloquea transformaciones de datos.
3. **Interfaz**: Bloqueo total visual para evitar uso no autorizado de recursos.

---

## 🚀 Conclusión

Este documento es una **referencia rápida** para asegurar que cada despliegue cumpla con los estándares de seguridad internacionales y las mejores prácticas de DevSecOps.

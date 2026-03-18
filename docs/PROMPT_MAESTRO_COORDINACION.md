# 🔐 Prompt Maestro – Coordinación de Agentes

## 📌 Contexto
Este proyecto SaaS multi-tenant utiliza la guía `docs/SECURITY_QUICK_REFERENCE.md` como referencia primaria de seguridad.  
Todos los agentes (Qwen CLI y Antigravity nativos) deben seguir este protocolo para garantizar cumplimiento con **ISO/IEC 27001:2022, NIST CSF, CSA, OWASP Top 10, DevSecOps y Xygeni**.

---

## 🎯 Instrucciones para los Agentes

### Qwen (CLI)
- Ejecutar validaciones automáticas en cada build:
  - `npm run check` (type-check + lint + test).
  - Escaneo de dependencias (`npm audit`, `snyk`).
  - Validación de IaC (Terraform/Kubernetes).
- Generar reportes de seguridad basados en `SECURITY_QUICK_REFERENCE.md`.
- Publicar resultados en el canal de seguridad (`#security-pipeline`).

### Antigravity Agents (Nativos)
- Aplicar reglas de seguridad en tiempo real:
  - RLS obligatorio en todas las queries.
  - Validación Zod en inputs.
  - Bloquear `select('*')` y `console.log` en producción.
- Monitorear runtime:
  - Intentos de login sospechosos.
  - Accesos indebidos entre tenants.
- Consultar `SECURITY_QUICK_REFERENCE.md` como checklist operativo.

---

## 🔄 Flujo de Trabajo Coordinado
1. **Qwen (CLI)** → Ejecuta pruebas y genera reportes de seguridad.
2. **Antigravity Agents** → Aplican reglas en runtime y monitoreo.
3. **Ambos** → Consultan `SECURITY_QUICK_REFERENCE.md` como protocolo común.
4. **Resultado** → Despliegue seguro y alineado con estándares internacionales.

---

## ✅ Checklist de Ejecución
- [ ] Qwen ejecuta validaciones en CI/CD.
- [ ] Antigravity aplica reglas en runtime.
- [ ] Ambos sincronizan hallazgos en `#security-pipeline`.
- [ ] Cumplimiento verificado contra `SECURITY_QUICK_REFERENCE.md`.

---

## 🚀 Objetivo Final
Garantizar que cada despliegue del SaaS cumpla con:
- OWASP Top 10
- DevSecOps pipeline
- Supply chain security (Xygeni)
- ISO/IEC 27001:2022
- NIST CSF
- CSA STAR
- Zero Trust (Zscaler/Palo Alto)
- Auditoría continua (Vanta/AppOmni)

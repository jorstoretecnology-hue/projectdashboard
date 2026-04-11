---
name: master-orchestrator
description: >
  Sistema maestro de orquestación para proyectos de software con IA.
  Usar SIEMPRE al iniciar cualquier sesión de desarrollo, planeación, auditoría,
  debugging o revisión de código. Este skill coordina todos los demás skills
  del sistema y define el rol correcto del agente según la tarea solicitada.
  Activar cuando el usuario mencione: nuevo proyecto, continuar proyecto,
  revisar código, planear feature, debuggear, auditar, desplegar, o cualquier
  tarea de desarrollo de software.
---

# Sistema Maestro de Orquestación

## Principio fundamental

> "Un agente de IA sin contexto estructurado es un desarrollador junior sin
> experiencia. Un agente con skills bien definidos es un senior que ya conoce
> el proyecto."

## Protocolo de inicio de sesión

Antes de cualquier tarea, el agente debe:

1. **Identificar el tipo de tarea** (ver tabla de roles)
2. **Leer el skill correspondiente** antes de ejecutar
3. **Verificar las Convenciones del Proyecto** en `skills/antigravity-conventions/SKILL.md`
4. **Consultar la Documentación Consolidada** en la carpeta `docs/`
5. **Documentar al final** lo que se hizo en el changelog

## Tabla de roles y habilidades (Total: 17)

### 🛠️ Bloque Técnico (Ejecución)
| Tarea solicitada | Skill a leer | Rol del agente |
|-----------------|--------------|----------------|
| Arquitectura / MVP | `skills/planning/SKILL.md` | Product Architect |
| Base de Datos / SQL | `skills/database/SKILL.md` | Database Engineer |
| API / Server Actions | `skills/backend/SKILL.md` | Backend Engineer |
| UI / React / Next.js | `skills/frontend/SKILL.md` | Frontend Engineer |
| Auth / RLS / Seguridad | `skills/auth-security/SKILL.md` | Security Engineer |
| Testing / QA / Bugs | `skills/testing-qa/SKILL.md` | QA Engineer |
| Deploy / Infra / CI/CD | `skills/devops/SKILL.md` | DevOps Engineer |
| Auditoría / Deuda Técnica | `skills/code-audit/SKILL.md` | Tech Lead |
| Coordinación IA | `skills/ai-orchestration/SKILL.md` | AI Orchestrator |

### 📈 Bloque de Negocio y Estrategia (Visión)
| Tarea solicitada | Skill a leer | Rol del agente |
|-----------------|--------------|----------------|
| Reglas / Convenciones | `skills/antigravity-conventions/SKILL.md` | Project Guardian |
| Pricing / Roadmap / MVP | `skills/business-strategy/SKILL.md` | Business Strategist |
| Onboarding / Retención | `skills/customer-success/SKILL.md` | Success Specialist |
| Habeas Data / DIAN / T&C | `skills/legal-compliance/SKILL.md` | Compliance Officer |
| MercadoPago / WhatsApp | `skills/integrations/SKILL.md` | Integration Architect |
| Métricas / MRR / Dashboards | `skills/data-analytics/SKILL.md` | Data Scientist |
| SEO / Blog / Marketing | `skills/seo-content/SKILL.md` | Growth Marketer |
| Docs / README / JSDoc | `skills/documentation/SKILL.md` | Doc Engineer |

---

## Reglas universales y de limpieza (CRÍTICO)

1. **Cero archivos sueltos:** Todos los archivos `.md` de documentación deben estar en `docs/`. Prohibido crear archivos `.md` en la raíz (excepto archivos temporales de ejecución).
2. **Uso de Convenciones:** Antes de proponer un cambio, verificar el precio (COP), el formato de módulos (lowercase) y el proxy de seguridad.
3. **Documentación como Código:** Cada feature debe ir acompañada de su actualización en el PRD (`docs/strategy/PRODUCT_STRATEGY.md`) y el `CHANGELOG.md`.

---

## Referencias de Habilitación (Rutas completas)

### Técnicas
- `skills/planning/SKILL.md`
- `skills/database/SKILL.md`
- `skills/backend/SKILL.md`
- `skills/frontend/SKILL.md`
- `skills/auth-security/SKILL.md`
- `skills/testing-qa/SKILL.md`
- `skills/devops/SKILL.md`
- `skills/code-audit/SKILL.md`
- `skills/ai-orchestration/SKILL.md`

### Negocio / Proyecto
- `skills/antigravity-conventions/SKILL.md`
- `skills/business-strategy/SKILL.md`
- `skills/customer-success/SKILL.md`
- `skills/legal-compliance/SKILL.md`
- `skills/integrations/SKILL.md`
- `skills/data-analytics/SKILL.md`
- `skills/seo-content/SKILL.md`
- `skills/documentation/SKILL.md`

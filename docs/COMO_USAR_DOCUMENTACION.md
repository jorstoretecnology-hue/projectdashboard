# 🚀 GUÍA RÁPIDA - Cómo Usar Esta Documentación

> **Guarda esto en tus favoritos** - Tu referencia rápida para navegar la documentación
>
> **Última actualización:** 18 de marzo de 2026

---

## ⚡ SI ERES NUEVO AQUÍ (15 minutos)

### Paso 1: Lee en Este Orden
```
1. docs/00-START-HERE.md           ← ÍNDICE MAESTRO (5 min)
2. docs/CONTEXTO_DEL_PROYECTO.md   ← Qué es este proyecto (5 min)
3. docs/PROGRESS_TRACKER.md        ← Qué se está haciendo ahora (5 min)
```

### Paso 2: Identifica Tu Rol

| Si eres... | Siguiente lectura | Tiempo |
|------------|-------------------|--------|
| **IA nueva** | `docs/operations/AI_QUICKSTART.md` | 5 min |
| **Desarrollador** | `docs/technical/MODULE_BLUEPRINT.md` | 10 min |
| **Arquitecto** | `ARCHITECTURE_SUMMARY.md` (raíz) | 15 min |
| **Security** | `docs/security/SECURITY_QUICK_REFERENCE.md` | 5 min |
| **Producto** | `docs/strategy/PRODUCT_STRATEGY.md` | 10 min |

---

## 🎯 SEGÚN TU TAREA ACTUAL

### 🛠️ Voy a Desarrollar una Feature Nueva
```bash
# 1. Patrón a seguir
docs/technical/MODULE_BLUEPRINT.md

# 2. Estructura de DB
docs/technical/DATABASE_SCHEMA.md

# 3. Permisos necesarios
docs/technical/PERMISSIONS_MATRIX.md

# 4. Flujos de negocio relacionados
docs/technical/BUSINESS_FLOWS.md
```

### 🐛 Voy a Arreglar un Bug
```bash
# 1. Verificar si es tema de seguridad
docs/security/SECURITY_CHECKLIST.md

# 2. Entender el flujo afectado
docs/technical/BUSINESS_FLOWS.md

# 3. Herramientas de debugging
docs/operations/DEBUG_BYPASSES.md
```

### 🔐 Voy a Tocar Autenticación/Permisos
```bash
# 1. CRÍTICO - Checklist de seguridad
docs/security/SECURITY_CHECKLIST.md

# 2. Matriz de roles
docs/security/PERMISSIONS_MATRIX.md

# 3. Reglas de RLS
docs/security/SECURITY_QUICK_REFERENCE.md
```

### 🧪 Voy a Escribir Tests
```bash
# 1. Estándares de testing
docs/operations/QA_GUIDE.md

# 2. Contrato de API
docs/technical/API_SPECIFICATION.md
```

### 💰 Voy a Trabajar con Pricing/Pagos
```bash
# 1. Planes y módulos
docs/strategy/plan_modulos_planes.md

# 2. Modelo de negocio
docs/strategy/PRODUCT_STRATEGY.md

# 3. Implementación actual
IMPLEMENTATION_STEPS.md (raíz)
```

### 📈 Voy a Planear Features
```bash
# 1. Visión del producto
docs/strategy/PRODUCT_STRATEGY.md

# 2. Roadmap 12 meses
docs/strategy/ROADMAP_12M.md

# 3. Plan de implementación
docs/strategy/IMPLEMENTATION_ROADMAP.md
```

---

## 📁 MAPA DE CARPETAS

```
docs/
│
├── 📄 00-START-HERE.md              ← ÍNDICE MAESTRO
├── 📄 CONTEXTO_DEL_PROYECTO.md      ← Contexto rápido
├── 📄 PROGRESS_TRACKER.md           ← Estado actual
│
├── 📁 technical/                    # CÓMO SE CONSTRUYE
│   ├── MODULE_BLUEPRINT.md          ← Patrón para módulos
│   ├── DATABASE_SCHEMA.md           ← Esquema de DB
│   ├── API_SPECIFICATION.md         ← Contrato de API
│   ├── BUSINESS_FLOWS.md            ← Flujos de negocio
│   ├── PERMISSIONS_MATRIX.md        ← Permisos y roles
│   ├── INDUSTRIES_ENGINE.md         ← Motor de industrias
│   ├── DOMAIN_STATES.md             ← Estados de dominio
│   ├── AUTOMATION_ENGINE.md         ← Automatizaciones
│   ├── COMMUNICATION_SYSTEM.md      ← WhatsApp/Email
│   └── INTEGRATION_GUIDE.md         ← Integraciones externas
│
├── 📁 security/                     # SEGURIDAD
│   ├── SECURITY_QUICK_REFERENCE.md  ← Referencia rápida
│   ├── SECURITY_PLAYBOOK_SaaS.md    ← Playbook integral
│   ├── SECURITY_CHECKLIST.md        ← Checklist técnica
│   ├── SECURITY_AUDIT_PROMPT.md     ← Prompt de auditoría
│   ├── SECURITY_PIPELINE_README.md  ← Guía del pipeline
│   ├── reports/                     ← Reportes históricos
│   │   └── 2026-03-18.md            ← Último reporte
│   └── audits/                      ← Auditorías completas
│       └── 2026-03-18-audit.md      ← Última auditoría
│
├── 📁 strategy/                     # ESTRATEGIA
│   ├── PRODUCT_STRATEGY.md          ← Visión y modelo
│   ├── ROADMAP_12M.md               ← Roadmap 12 meses
│   ├── IMPLEMENTATION_ROADMAP.md    ← Plan de implementación
│   └── plan_modulos_planes.md       ← Planes y módulos
│
├── 📁 operations/                   # DÍA A DÍA
│   ├── AI_QUICKSTART.md             ← Guía para IAs nuevas
│   ├── TASK_HANDOFF_TEMPLATE.md     ← Plantilla de handoff
│   ├── DEBUG_BYPASSES.md            ← Bypasses para dev
│   ├── QA_GUIDE.md                  ← Guía de QA
│   └── walkthrough.md               ← Walkthrough completo
│
├── 📁 ai-coordination/              # COORDINACIÓN IA
│   ├── PROMPT_ANTIGRAVITY.md        ← Prompt para Antigravity
│   └── PROMPT_MAESTRO_COORDINACION.md ← Protocolo de coordinación
│
└── 📁 archive/                      # HISTÓRICOS
    └── ...                          ← Archivos > 7 días
```

---

## 🔧 COMANDOS RÁPIDOS

### Desarrollo
```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción
```

### Calidad de Código
```bash
npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run lint:fix         # Auto-fix ESLint
npm run format           # Prettier write
npm run format:check     # Prettier check
```

### Testing
```bash
npm test                 # Vitest run
npm run test:watch       # Vitest watch
npm run test:coverage    # Vitest con coverage
```

### Verificación Completa
```bash
npm run check            # type-check + lint + test (paralelo)
```

### Seguridad
```bash
npm run security:audit   # Ejecutar auditoría completa
npm run security:validate # Validar reporte JSON
```

### Limpieza de Código
```bash
npx ts-prune             # Detectar código muerto TypeScript
npx knip                 # Detectar imports no usados
```

---

## 📊 ESTADO ACTUAL (Resumen)

### ✅ Completado (v4.7.0)
- Multi-tenancy con RLS completo
- Autenticación Supabase (Email + Google)
- Onboarding progresivo de 3 pasos
- Sistema de invitaciones por email
- 7 industrias configuradas
- Activación automática de módulos
- Pricing vertical por industria
- Security pipeline con validación JSON

### 🔒 Security Audit (18 Marzo 2026)
| Métrica | Valor | Estado |
|---------|-------|--------|
| Type Errors | 0 | ✅ |
| Tests Passing | 24/24 | ✅ |
| Vulnerabilidades | 7 (3 high) | ⚠️ |
| Console.log | 0 | ✅ |
| Select(*) | 0 | ✅ |
| Any Types (core) | 0 | ✅ |

### 🚧 En Progreso
- [ ] Pagos con MercadoPago (P0 - Fase 11)
- [ ] Internacionalización (i18n)
- [ ] Facturación electrónica Colombia

---

## 🎯 PRÓXIMOS PASOS CONCRETOS

### Esta Semana (P0)
1. **Ejecutar migraciones SQL en Supabase**
   - Abrir: https://app.supabase.com/project/_sql
   - Ejecutar: `20260314000000_activate_modules_for_tenants.sql`
   - Ejecutar: `20260314000001_get_tenant_price.sql`
   - Ver: `IMPLEMENTATION_STEPS.md`

2. **Integración MercadoPago**
   - Conectar RPCs de pricing con pasarela
   - Activar paso de facturación en onboarding
   - Ver: `docs/strategy/plan_modulos_planes.md`

3. **Limpieza de código**
   - Eliminar 55 tipos `any` restantes
   - Migrar 64 console.log a logger.ts
   - Refactorizar 7 queries `select('*')`

---

## 📞 CONTACTO Y SOPORTE

### Canales
- **GitHub Issues:** Bugs y feature requests
- **Slack Antigravity:** #dashboard-universal
- **Email:** soporte@antigravity.com

### Horarios
- **Lunes a Viernes:** 9:00 AM - 6:00 PM (Bogotá)
- **Sábados:** 9:00 AM - 1:00 PM (Bogotá)
- **Emergencias:** 24/7 vía Slack

---

## 📋 CHECKLIST DE INICIO DE SESIÓN

```bash
# 1. Verificar estado del repositorio
git status
git log -n 5

# 2. Leer estado actual
cat docs/PROGRESS_TRACKER.md

# 3. Leer handoff anterior (si existe)
cat docs/archive/SESSION_HANDOFF_*.md

# 4. Iniciar servidor
npm run dev

# 5. Identificar tarea inmediata
# Ver: docs/00-START-HERE.md → "Próximos Pasos Concretos"
```

---

## ✅ CHECKLIST DE FIN DE SESIÓN

```bash
# 1. Hacer commit de todos los cambios
git add -A && git commit -m "feat: descripción"

# 2. Verificar tests
npm test

# 3. Verificar lint
npm run lint

# 4. Actualizar handoff
# Editar: docs/operations/TASK_HANDOFF_TEMPLATE.md

# 5. Actualizar progreso (si aplica)
# Editar: docs/PROGRESS_TRACKER.md

# 6. Verificar build
npm run build
```

---

## 🔗 LINKS RÁPIDOS

| Recurso | Link |
|---------|------|
| **Índice Maestro** | [docs/00-START-HERE.md](docs/00-START-HERE.md) |
| **Contexto** | [docs/CONTEXTO_DEL_PROYECTO.md](docs/CONTEXTO_DEL_PROYECTO.md) |
| **Estado Actual** | [docs/PROGRESS_TRACKER.md](docs/PROGRESS_TRACKER.md) |
| **Arquitectura** | [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md) |
| **Cambios** | [CHANGELOG.md](CHANGELOG.md) |
| **Implementación** | [IMPLEMENTATION_STEPS.md](IMPLEMENTATION_STEPS.md) |

---

## 💡 TIPS DE PRODUCTIVIDAD

### Atajos de Desarrollo
```bash
# Ver código no usado
npx ts-prune

# Ver imports no usados
npx knip

# Ver logs filtrados (útil para debugging)
npm run dev 2>&1 | grep -E "\[PostAuth\]|\[TenantContext\]|\[Middleware\]"

# Limpiar caché de Next.js (si hay problemas de hidratación)
rm -rf .next && npm run dev
```

### Debugging en Navegador
```javascript
// En consola del navegador
const { data } = await supabase.auth.getUser()
console.log('User:', data.user)
console.log('Tenant ID:', data.user?.app_metadata?.tenant_id)
console.log('Role:', data.user?.app_metadata?.app_role)
```

---

**¿Listo para empezar? → [docs/00-START-HERE.md](docs/00-START-HERE.md)** 🚀

*Guarda este archivo en tus favoritos o imprímelo como referencia rápida.*

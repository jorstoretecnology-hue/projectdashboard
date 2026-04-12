# AI_SYNC.md

> Última actualización: Abril 11, 2026
> Documento de coordinación entre agentes IA

---

## Pivote Estratégico — Abril 2026

**Decisión:** Simplificar a núcleo universal POS + CRM + DIAN.
Lo complejo se delega a n8n + APIs de terceros.

**Fuera del alcance (no construir internamente):**

- Reservas complejas → integrar Cal.com
- Facturación DIAN directa → usar Alegra API
- WhatsApp → Twilio / Meta API via n8n
- Reportes complejos → n8n workflows

**Núcleo a construir:**

- POS universal (sales ya existe, simplificar)
- CRM (customers ya existe)
- DIAN via Alegra API (pendiente)
- Dashboard con módulos activables (✅ funcionando)

**Módulos activables por industria (no verticales hardcodeados):**

- work_orders + vehicles → taller
- reservations + accommodations → glamping
- tables_events → restaurante
- memberships → gym

---

## Arquitectura de Agentes

```
ORQUESTADOR
└── Claude (chat.claude.ai)
    → Define specs antes de cualquier código
    → Toma decisiones arquitectónicas
    → Genera prompts exactos para ejecutores
    → Revisa DB via MCP Supabase
    → Valida resultado final
    → Actualiza esta documentación

EJECUTOR UI
└── Antigravity IDE (Gemini)
    → Implementa componentes React/Next.js
    → Trabaja sobre specs definidas por Claude
    → No toma decisiones arquitectónicas
    → Reporta errores al orquestador
    → Convención de archivos: proxy.ts (NO middleware.ts en Next.js 16)

EJECUTOR CLI/DB
└── Qwen Code (terminal PowerShell)
    → Ejecuta SQL y migraciones
    → Implementa Server Actions y API Routes
    → No modifica schema sin instrucción explícita
    → Confirma antes de operaciones destructivas
    → Siempre corre: npx tsc --noEmit después de cambios
```

---

## Reglas de coordinación

### Antes de cualquier tarea

1. Claude define la SPEC completa
2. Claude genera el prompt exacto para el agente ejecutor
3. El agente ejecuta — no improvisa
4. Claude valida el resultado

### Regla del archivo único (Gemini)

No pasar todo el proyecto. Solo el archivo donde se trabaja + tipos necesarios.

### Prefijo de sistema para todos los agentes

```
Eres un experto en Next.js App Router, Tailwind CSS y Supabase.
Sé conciso. No expliques el código a menos que te lo pida.
Usa TypeScript estricto. tenant_id SIEMPRE del JWT, nunca del body.
```

### Nunca hacer sin consultar a Claude primero

- Cambiar estructura de tablas en producción
- Modificar RLS policies
- Cambiar el flujo de auth o onboarding
- Renombrar archivos de infraestructura (proxy.ts, layout.tsx)
- Modificar MODULE_DEFINITIONS sin agregar también a modules_catalog

---

## Convenciones críticas del proyecto

| Concepto       | Regla                                           |
| -------------- | ----------------------------------------------- |
| Middleware     | `src/proxy.ts` (Next.js 16 — NO middleware.ts)  |
| tenant_id      | Siempre del JWT: `user.app_metadata?.tenant_id` |
| Precios        | INTEGER en COP, nunca FLOAT                     |
| Módulo IDs     | Siempre lowercase: 'pos', 'crm', 'dian'         |
| Rutas admin    | `/console/*` (obfuscado)                        |
| Service client | Solo en Server Actions, nunca en cliente        |
| Selects        | Nunca `select('*')` — especificar columnas      |
| Soft delete    | `deleted_at` — nunca borrar permanente          |

---

## Stack tecnológico

| Capa              | Tecnología                              |
| ----------------- | --------------------------------------- |
| Frontend          | Next.js 16.2.2 App Router + Turbopack   |
| Base de datos     | Supabase (PostgreSQL 17)                |
| Auth              | Supabase Auth + RLS                     |
| Estilos           | Tailwind CSS + Shadcn UI + Radix        |
| Validación        | Zod                                     |
| Pagos             | MercadoPago (LATAM)                     |
| Facturación DIAN  | Alegra API (pendiente)                  |
| Emails            | Resend                                  |
| Monitoreo         | Sentry                                  |
| Automatización    | n8n (self-hosted o cloud)               |
| IA en producto    | Kimi K2 API (evaluando)                 |
| Deploy            | Vercel                                  |
| Proyecto Supabase | kpdadwtxfazhtoqnttdh (DashboardProject) |

---

## MCP conectados

| MCP             | Uso                                           |
| --------------- | --------------------------------------------- |
| Supabase        | Revisar DB, ejecutar SQL, aplicar migraciones |
| Google Calendar | Disponible                                    |
| Gmail           | Disponible                                    |

---

## Señales de alerta — parar y consultar a Claude

- Una función hace más de una cosa
- Un archivo tiene más de 400 líneas
- Hay lógica duplicada en 2+ lugares
- Un cambio rompe más de 3 archivos
- Se quiere renombrar un archivo de infraestructura
- Error de RLS en producción
- tenant_id viene de algún lugar que no sea el JWT

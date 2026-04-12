# AI_SYNC.md

> Última actualización: Abril 11, 2026 — Sesión 2

---

## Pivote Estratégico — Abril 2026

**Decisión:** Núcleo universal POS + CRM + DIAN. Lo complejo a n8n + APIs terceros.

**Fuera del alcance — no construir internamente:**

- Reservas → Cal.com API
- DIAN directo → Alegra API
- WhatsApp → Twilio / Meta API via n8n
- Reportes complejos → n8n workflows

**Núcleo construido:**

- POS (`sales` ✅)
- CRM (`customers` ✅)
- Dashboard con módulos activables (✅)
- DIAN via Alegra (❌ pendiente)

---

## Arquitectura de Agentes

**ORQUESTADOR — Claude (chat.claude.ai)**

- Define specs antes de cualquier código
- Toma decisiones arquitectónicas
- Genera prompts exactos para ejecutores
- Revisa y modifica DB directamente via MCP Supabase
- Valida resultado final
- Actualiza esta documentación

**EJECUTOR UI — Antigravity IDE (Gemini)**

- Implementa componentes React/Next.js
- Solo implementa lo que Claude define
- No toma decisiones arquitectónicas
- Reporta errores al orquestador

**EJECUTOR CLI/DB — Qwen Code (PowerShell)**

- Ejecuta SQL y migraciones
- Implementa Server Actions y API Routes
- No modifica schema sin instrucción de Claude
- Siempre corre `npx tsc --noEmit` después de cambios
- Confirma antes de operaciones destructivas

---

## Prefijo de sistema para todos los agentes

> Eres un experto en Next.js App Router, Tailwind CSS y Supabase.
> Sé conciso. No expliques el código a menos que te lo pida.
> Usa TypeScript estricto. tenant_id SIEMPRE del JWT app_metadata,
> nunca del body. Precios siempre INTEGER en COP, nunca decimales.

---

## Reglas de coordinación

1. **Claude define la SPEC → agente ejecuta → Claude valida**
2. **Regla del archivo único:** pasar solo el archivo donde se trabaja
3. **Nunca hacer sin consultar a Claude:**
   - Cambiar estructura de tablas
   - Modificar RLS policies
   - Renombrar archivos de infraestructura
   - Modificar `MODULE_DEFINITIONS` sin actualizar `modules_catalog`

---

## Convenciones críticas — INMUTABLES

| Concepto           | Regla                                                        |
| ------------------ | ------------------------------------------------------------ |
| **Middleware**     | `src/proxy.ts` — Next.js 16. NUNCA renombrar a middleware.ts |
| **tenant_id**      | Siempre del JWT: `user.app_metadata?.tenant_id`              |
| **Precios**        | INTEGER en COP. NUNCA numeric, decimal o float               |
| **Módulo IDs**     | Siempre lowercase: 'pos', 'crm', 'dian'                      |
| **Rutas admin**    | `/console/*` (obfuscado)                                     |
| **Service client** | Solo en Server Actions, nunca en cliente                     |
| **Selects**        | NUNCA `select('*')` — especificar columnas siempre           |
| **Soft delete**    | `deleted_at` — nunca borrar permanente                       |
| **TypeScript**     | NUNCA usar `any` — siempre tipar explícitamente              |
| **Zod precios**    | `z.number().int().positive()` — siempre con `.int()`         |

---

## Stack tecnológico

| Capa                 | Tecnología                                    |
| -------------------- | --------------------------------------------- |
| **Frontend**         | Next.js 16.2.2 App Router + Turbopack         |
| **Base de datos**    | Supabase PostgreSQL 17 (kpdadwtxfazhtoqnttdh) |
| **Auth**             | Supabase Auth + RLS                           |
| **Estilos**          | Tailwind CSS + Shadcn UI + Radix              |
| **Validación**       | Zod (siempre `.int()` en precios)             |
| **Pagos SaaS**       | MercadoPago (parcial)                         |
| **Facturación DIAN** | Alegra API (pendiente integración)            |
| **Emails**           | Resend                                        |
| **Automatización**   | n8n                                           |
| **IA en producto**   | Kimi K2 API (evaluando)                       |
| **Deploy**           | Vercel                                        |

---

## MCP conectados a Claude

| MCP                 | Uso                                                        |
| ------------------- | ---------------------------------------------------------- |
| **Supabase**        | Revisar DB, ejecutar SQL, aplicar migraciones directamente |
| **Google Calendar** | Disponible                                                 |
| **Gmail**           | Disponible                                                 |

---

## Señales de alerta — parar y consultar a Claude

- Una función hace más de una cosa
- Un archivo tiene más de 400 líneas
- Hay lógica duplicada en 2+ lugares
- Se quiere renombrar `proxy.ts`
- Error de RLS en producción
- `tenant_id` viene de algún lugar que no sea el JWT
- Precio guardado con decimales
- Se usa `select('*')` en código nuevo

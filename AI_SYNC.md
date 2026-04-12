# AI_SYNC.md
> Última actualización: Abril 12, 2026 — Sesión 7 (v6.1.0)

---

## Pivote Estratégico — Abril 2026

**Decisión:** Núcleo universal POS + CRM + DIAN. Lo complejo a n8n + APIs terceros.

**Fuera del alcance:**
- Reservas → Cal.com API
- DIAN directo → Alegra API
- WhatsApp → Twilio / Meta API via n8n
- Reportes complejos → n8n workflows

---

## Arquitectura de Agentes

```
ORQUESTADOR — Claude (chat.claude.ai)
  → Define specs antes de cualquier código
  → Toma decisiones arquitectónicas
  → Revisa y modifica DB directamente via MCP Supabase
  → Genera prompts exactos para ejecutores
  → Valida resultados y actualiza documentación

EJECUTOR UI — Antigravity IDE (Gemini / MiniMax)
  → Implementa componentes React/Next.js
  → Solo implementa lo que Claude define
  → No toma decisiones arquitectónicas
  → Reporta errores al orquestador

EJECUTOR CLI/DB — Qwen Code (PowerShell)
  → Ejecuta SQL, migraciones y Server Actions
  → No modifica schema sin instrucción de Claude
  → Siempre corre npx tsc --noEmit después de cambios
  → Confirma antes de operaciones destructivas
```

---

## Prefijo de sistema para todos los agentes

```
Eres un experto en Next.js App Router, Tailwind CSS y Supabase.
Sé conciso. No expliques el código a menos que te lo pida.
Usa TypeScript estricto. tenant_id SIEMPRE del JWT app_metadata,
nunca del body. Precios siempre INTEGER en COP, nunca decimales.
Nunca usar select('*') — siempre especificar columnas.
Nunca usar tipos any — siempre tipar explícitamente.
```

---

## Convenciones críticas — INMUTABLES

| Concepto | Regla |
|----------|-------|
| **Middleware** | `src/proxy.ts` — Next.js 16. NUNCA renombrar a middleware.ts |
| **tenant_id** | Siempre del JWT: `user.app_metadata?.tenant_id` |
| **Precios** | INTEGER en COP. NUNCA numeric, decimal o float |
| **Formateo precios** | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })` |
| **Selects** | NUNCA `select('*')` — especificar columnas siempre |
| **TypeScript** | NUNCA usar `any` — siempre tipar explícitamente |
| **Zod precios** | `z.number().int().positive()` — siempre con `.int()` |
| **Módulo IDs** | Siempre lowercase: 'pos', 'crm', 'dian' |
| **Rutas admin** | `/console/*` (obfuscado) |
| **Performance RLS**| **JWT-First**: Prohibido hacer queries a `profiles` dentro de políticas RLS |
| **Inmunidad** | **Billing Guards**: Usar `useSubscriptionGuard` para bloquear escrituras por mora |
| **Fotos** | Siempre URLs de Supabase Storage, nunca base64 en DB |
| **Dashboard** | Server Component — nunca convertir a use client |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16.2.2 App Router + Turbopack |
| Base de datos | Supabase PostgreSQL 17 (kpdadwtxfazhtoqnttdh) |
| Auth | Supabase Auth + RLS |
| Storage | Supabase Storage (buckets: products, signatures, inspections) |
| Validación | Zod (siempre .int() en precios) |
| Pagos SaaS | MercadoPago (parcial) |
| Facturación DIAN | Alegra API (pendiente) |
| Automatización | n8n |
| IA en producto | Kimi K2 API (evaluando) |

---

## Señales de alerta — parar y consultar a Claude

- Una función hace más de una cosa
- Un archivo tiene más de 400 líneas
- Se quiere renombrar proxy.ts
- Error de RLS en producción
- tenant_id viene de algún lugar que no sea el JWT
- Precio guardado con decimales
- Se usa `select('*')` en código nuevo
- Se usa `any` en TypeScript nuevo
- Se guarda base64 en la DB en vez de URL de Storage

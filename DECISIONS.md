# DECISIONS.md

> Decisiones arquitectónicas y por qué se tomaron

---

## [2026-04-11] Precios como INTEGER en COP

**Decisión:** Todos los precios en el sistema son INTEGER en pesos colombianos.

**Razón:**

- COP no usa centavos en transacciones cotidianas
- Evita errores de punto flotante en cálculos financieros
- Simplifica validaciones (z.number().int())
- Estándar para SaaS colombianos

**Implementación:**

- 16 columnas migradas de NUMERIC a INTEGER
- Zod schemas con `.int()` obligatorio
- Frontend usa `Intl.NumberFormat('es-CO')` para mostrar

**Regla:** NUNCA usar numeric, decimal o float para precios. Si un precio
viene con decimales del exterior (ej: Alegra API), redondear al entero
más cercano antes de guardar.

---

## [2026-04-11] Módulo DIAN como activable premium (no en núcleo base)

**Decisión:** DIAN es módulo del plan Pro — no incluido en Basic ni Free.

**Razón:**

- Tiene costo operativo real (Alegra API ~$50k COP/mes por cliente)
- No todos los negocios pequeños están obligados aún
- Justifica el precio diferencial del plan Pro
- Permite cobrar setup más alto (configuración Alegra + DIAN)

**Implementación futura:** `activate_modules_for_tenant` plan 'pro' incluirá 'dian'.
Credenciales Alegra guardadas en tabla `alegra_credentials` por tenant.

---

## [2026-04-11] proxy.ts como nombre del middleware (Next.js 16)

**Decisión:** El archivo de middleware se llama `src/proxy.ts` en este proyecto.

**Razón:** Next.js 16.2.2 cambió la convención. `middleware.ts` está deprecado
y causa warnings + hanging en compilación. El compilador busca `proxy.ts`.

**Regla inmutable:** No renombrar este archivo sin verificar la versión de Next.js.
Si se actualiza Next.js, verificar si la convención cambió nuevamente.

---

## [2026-04-11] Pivot a núcleo universal + módulos activables

**Decisión:** De "SaaS por vertical" a "núcleo universal + módulos por industria"

**Contexto:** El proyecto tenía lógica de industria hardcodeada en componentes.
POSDialog detectaba taller/restaurante y cambiaba comportamiento internamente.

**Razón:**

- Shopify no construye cada tienda diferente — tiene un núcleo y apps
- Un taller y un restaurante comparten POS + CRM + DIAN
- Lo que los diferencia son módulos adicionales activables
- Reduce complejidad del código base significativamente

**Implementación:**

- Núcleo: dashboard, sales, customers, settings (todos los planes)
- Por industria: work_orders+vehicles (taller), tables_events (restaurante),
  memberships (gym), reservations+accommodations (glamping)

---

## [2026-04-11] APIs de terceros para funcionalidad compleja

**Decisión:** No construir internamente lo que ya existe bien construido.

| Función          | Solución       | Razón                                 |
| ---------------- | -------------- | ------------------------------------- |
| Facturación DIAN | Alegra API     | Ya certificado ante DIAN              |
| Reservas         | Cal.com embed  | API completa, open source             |
| WhatsApp         | Twilio via n8n | Asíncrono, no requiere código Next.js |
| Pagos SaaS       | MercadoPago    | Líder LATAM                           |

**Principio:** El valor de Antigravity está en conectar estas piezas de forma
que un negocio colombiano pequeño pueda usarlas sin saber que existen.

---

## [2026-04-11] Modelo agencia primero, SaaS después

**Decisión:** Vender como agencia con instalación manual en Pereira primero.

**Razón:**

- Ingresos inmediatos para financiar desarrollo
- Aprender qué necesitan clientes reales antes de automatizar
- Cada cliente manual enseña qué pantallas necesita el self-service
- Mercado colombiano prefiere "alguien que responda" sobre app pura

**Transición:** Mes 7-12, cuando haya 5+ clientes y el onboarding esté pulido.

---

## [2026-04-11] tenant_id del JWT — regla de seguridad inmutable

**Decisión:** tenant_id siempre de `user.app_metadata?.tenant_id`

**Razón de seguridad:** Si viniera del body, un atacante podría modificarlo
y acceder a datos de otro tenant. El JWT es firmado por Supabase y no
puede ser alterado por el cliente.

**Capas de seguridad:**

1. JWT: `user.app_metadata?.tenant_id` en código
2. RLS: `get_current_user_tenant_id()` en Supabase
3. ModuleContext: fallback a profiles solo si JWT no tiene tenant_id

---

## [2026-04-11] Shared DB con RLS (no DB por tenant)

**Decisión:** Un solo proyecto Supabase para todos los tenants.

**Razón:**

- Costo: una DB vs N databases — mucho más barato hasta 100+ clientes
- Mantenimiento: una sola migración para todos
- RLS garantiza aislamiento a nivel de fila

**Cuándo revisar:** Cliente Enterprise que exija aislamiento total por
regulaciones (salud, financiero). En ese caso, proyecto Supabase dedicado.

✅ Precios NUMERIC → INTEGER COP
✅ Schemas Zod con .int()
✅ select('\*') y select() sin columnas — RESUELTO
✅ SKILL convenciones — proxy.ts documentado
✅ Tipos any — 5 errores TS corregidos (Sesión 3)
→ CustomersClient.tsx:33 — import nuqs agregado
→ PaymentHistory.tsx:86 — formatCurrency corregido
→ MobileSidebar.tsx:22,63 — signOut + navigation label
→ Sidebar.tsx:22 — IconRenderer exportado
✅ dashboard/page.tsx → Server Component (Sesión 3)

⬜ POSDialog lógica de industria
⬜ Fotos base64 → Supabase Storage

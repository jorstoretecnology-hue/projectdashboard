# DECISIONS.md

> Decisiones arquitectónicas y por qué se tomaron

---

## [2026-04-11] Pivot a núcleo universal

**Decisión:** Simplificar de "SaaS por vertical" a "núcleo universal + módulos activables"

**Contexto:** El proyecto tenía lógica de industria hardcodeada en componentes
(POSDialog detectaba taller/restaurante y cambiaba su comportamiento). Esto generaba
complejidad que impedía avanzar rápido y era difícil de mantener.

**Alternativas consideradas:**

- A) Mantener verticales separados → descartado: duplicación de código, difícil de escalar
- B) Un producto genérico sin verticales → descartado: pierde valor para negocios específicos
- C) Núcleo universal + módulos activables por industria ✅ elegida

**Razón:** Shopify no construye cada tienda diferente — tiene un núcleo y apps. El mismo
principio aplica aquí. Un taller y un restaurante comparten POS + CRM + DIAN. Lo que
los diferencia son módulos adicionales.

---

## [2026-04-11] APIs de terceros para lo complejo

**Decisión:** No construir internamente reservas, DIAN directo, ni WhatsApp

**DIAN → Alegra API**

- Razón: Alegra ya está certificado ante la DIAN. Construirlo desde cero tomaría meses
  y requiere certificación propia. Costo: ~$50k COP/mes por cliente, precio que se
  traslada al plan premium.

**Reservas → Cal.com (open source)**

- Razón: Cal.com tiene API completa, se puede embedder, y evita construir un sistema
  de calendario desde cero. El módulo `reservations` en Antigravity solo muestra
  el embed + sincroniza con el CRM via n8n.

**WhatsApp → Twilio / Meta API via n8n**

- Razón: Las notificaciones son asíncronas y no requieren lógica en el frontend.
  n8n maneja el flujo completo sin tocar el código de Next.js.

---

## [2026-04-11] proxy.ts como nombre del middleware

**Decisión:** Usar `proxy.ts` en Next.js 16 (no `middleware.ts`)

**Contexto:** Next.js 16.2.2 cambió la convención. El archivo `middleware.ts` está
deprecado y causa warnings + hanging en compilación. El nuevo nombre es `proxy.ts`.

**Regla:** No renombrar este archivo sin verificar la versión de Next.js primero.

---

## [2026-04-11] tenant_id del JWT, nunca del body

**Decisión:** `tenant_id` siempre de `user.app_metadata?.tenant_id`

**Razón de seguridad:** Si el tenant_id viniera del body de la request, un atacante
podría modificarlo y acceder a datos de otro tenant. El JWT es firmado por Supabase
y no puede ser alterado por el cliente.

**Implementación:**

- Onboarding escribe `tenant_id` en `app_metadata` al crear el tenant
- ModuleContext lo lee del JWT con fallback a `profiles` para usuarios legacy
- Todas las API routes usan `user.app_metadata?.tenant_id`
- RLS en Supabase usa `get_current_user_tenant_id()` como segunda capa de seguridad

---

## [2026-04-11] Modelo de negocio: Agencia primero, SaaS después

**Decisión:** Vender como agencia con 3-5 clientes en Pereira, luego escalar a self-service

**Razón:**

- Ingresos inmediatos para financiar el desarrollo
- Aprender qué necesitan los clientes reales antes de automatizar
- Cada cliente manual enseña qué pantallas necesita el self-service

**Estructura de precios inicial:**

- Setup: $800k - $1.5M COP (una vez)
- Mensualidad: $250k - $400k COP/mes según módulos
- Módulos extra: $100k - $200k COP/mes cada uno

**Transición a self-service:** Mes 7-12, cuando el onboarding esté pulido
y haya al menos 5 clientes validando el flujo.

---

## [2026-04-11] Shared DB con RLS (no DB por tenant)

**Decisión:** Un solo proyecto Supabase para todos los tenants

**Razón:**

- Costo: Una DB compartida vs N databases = mucho más barato hasta 100+ clientes
- Mantenimiento: Una sola migración para todos
- RLS garantiza aislamiento a nivel de fila

**Cuándo revisar:** Si algún cliente Enterprise exige aislamiento total por
regulaciones (ej: sector salud o financiero). En ese caso crear proyecto Supabase
dedicado solo para ese cliente.

---

## [2026-04-11] Módulo DIAN como activable, no en el núcleo base

**Decisión:** DIAN es un módulo premium, no parte del plan free

**Razón:**

- Tiene costo operativo (Alegra API por cliente)
- No todos los negocios pequeños están obligados a facturar electrónicamente aún
- Permite cobrar más por el plan que lo incluya
- Genera diferenciación clara entre planes

**Plan que incluirá DIAN:** Starter o Professional (definir al integrar Alegra)

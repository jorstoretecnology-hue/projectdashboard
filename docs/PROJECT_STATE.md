# Estado del Proyecto — Antigravity SaaS
**Última actualización:** 15 de Marzo 2026  
**Próxima sesión objetivo:** MercadoPago + Billing page

---

## ✅ Funcionando en producción

### Infraestructura
- Multi-tenant con RLS y `get_current_user_tenant_id()` con fallback
- Auth completa: login, registro, recuperación de contraseña (OTP pendiente mejora)
- Middleware/proxy.ts protegiendo rutas por rol
- Rate limiting con Upstash (tolerante a fallos)
- Signed URLs para bucket `signatures`

### Base de datos
- 9 industrias: taller, restaurante, supermercado, ferreteria, gym, glamping, discoteca
- 15 módulos en `modules_catalog`
- Módulos automáticos por plan e industria (trigger activo)
- Pricing por vertical en `industry_pricing` (21 registros)
- `get_tenant_price(tenant_id, plan_slug, billing_cycle)` RPC funcionando
- `activate_modules_for_tenant()` RPC funcionando
- DB limpia: 0 tenants duplicados u huérfanos

### Módulos por plan
- **Free:** dashboard, inventory, sales
- **Starter:** + customers, purchases, reports, billing, settings, users
- **Pro/Enterprise:** + work_orders, vehicles, reservations, memberships, accommodations, tables_events

### Módulos activos verificados en producción
| Tenant | Industria | Plan | Módulos |
|--------|-----------|------|---------|
| ACME Corporation | taller | enterprise | 11 ✅ |
| Agencia Demo Pro | glamping | professional | 11 ✅ |
| Global Solutions Ltd | restaurante | enterprise | 10 ✅ |
| Retail Plus | ferreteria | starter | 9 ✅ |
| TechStart Inc | supermercado | professional | 9 ✅ |
| Demo Client | gym | free | 3 ✅ |
| jaomart | taller | free | 3 ✅ |

---

## 🟡 En desarrollo / Pendiente

### Prioridad ALTA
- **MercadoPago real** — tablas listas, falta adaptador y webhooks
- **Billing page** — debe leer de `industry_pricing`, actualmente mock
- **Onboarding → llamar RPC** — agregar `activate_modules_for_tenant()` al completar registro

### Prioridad MEDIA
- **OTP 6 dígitos** — reemplazar magic link de recuperación
- **Fotos de inspección en Storage** — actualmente base64 en JSONB (TODO en código)
- **service_orders** — tabla básica, falta vehicle_id, customer_id, labor_cost

### Prioridad BAJA
- **Consolidar migraciones SQL** — 70+ migraciones, limpiar en algún momento
- **Rate limiting en endpoints individuales** — actualmente solo en middleware global
- **App móvil** — futura fase

---

## 🔴 Conocido y bloqueante

- **Facturación DIAN** — sin esto no se puede vender a clientes colombianos reales
- **Sin clientes pagando** — el producto está listo pero sin ingresos

---

## Decisiones técnicas clave

| Decisión | Por qué |
|----------|---------|
| Shared DB + RLS (no DB por tenant) | Simplicidad, costo, suficiente para el mercado objetivo |
| /console/* (no /superadmin/*) | Ofuscación de rutas de admin |
| Precios en INTEGER COP | Nunca decimales en precios colombianos |
| Módulos en lowercase | Sincronización con tenant_modules en DB |
| industry_pricing separado de plans | Permite pricing por vertical sin cambiar estructura de planes |

---

## Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js | 16.1.1 |
| Runtime | Node.js | 20+ |
| DB | Supabase (PostgreSQL) | último |
| Auth | Supabase Auth | — |
| Estilos | Tailwind CSS | v3 |
| Componentes | Radix UI / shadcn | — |
| Validación | Zod | — |
| Emails | Resend | — |
| Errores | Sentry | — |
| Rate limit | Upstash Redis | — |
| Pagos | MercadoPago | pendiente |
| Deploy | Vercel | — |

---

## Agentes IA en el proyecto

| Agente | Rol | Herramienta |
|--------|-----|-------------|
| Claude | Orquestador, arquitecto, prompts | claude.ai |
| Antigravity | Ejecutor UI/React/Next.js | Gemini IDE |
| Qwen | Ejecutor CLI/DB/migraciones | Qwen Code CLI |

---

## Próxima sesión

**Objetivo:** Integrar MercadoPago para poder cobrar  
**Prerequisito:** Tener credenciales de MP (client_id, access_token, public_key)  
**Agente principal:** Claude genera prompts → Antigravity implementa → Qwen ejecuta webhooks  
**Definición de éxito:** Un tenant puede hacer upgrade de Free a Starter y ser cobrado realmente

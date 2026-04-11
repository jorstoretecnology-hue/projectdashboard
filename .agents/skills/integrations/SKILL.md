---
name: integrations
description: >
  Patrones de integración con servicios externos: MercadoPago, DIAN,
  WhatsApp Business, Resend, Sentry, Upstash y otros. Usar cuando el
  usuario quiera: integrar pagos, configurar facturación electrónica,
  enviar emails, notificaciones WhatsApp, monitoreo de errores, o
  cualquier servicio de terceros. Activar con: MercadoPago, DIAN,
  WhatsApp, Resend, Sentry, Upstash, integración, webhook, pago,
  pasarela, facturación electrónica, email, notificación.
---

# Integraciones con Servicios Externos

## 1. Patrón Generador de Integraciones
**Regla:** Siempre usar `Server Actions` o `API Routes` con control de firmas en webhooks.

1. **Autenticación:** Las API Keys deben estar en `.env.local`.
2. **Validación:** No procesar datos externos sin validación Zod.
3. **Persistencia:** Registrar el `provider_id` y `status` en la DB.

---

## 2. MercadoPago (Pasarela de Pagos)
- **Modo:** Preferencia de pago con redirección.
- **Workflow:** Crear ticket -> Redirigir a MP -> Recibir Webhook -> Actualizar Suscripción.
- **Webhook Sec:** Validar siempre con el `X-Signature`.

---

## 3. DIAN (Facturación Electrónica vía API)
**Postura Integradora:**
- Usar un **Adaptador de Facturador** para abstraer el proveedor tecnológico (vía API REST).
- Guardar `CUFE`, `QR_URL` y `XML_URL` en la tabla de ventas.
- El sistema es agnóstico al proveedor (E-Invoicing Readiness).

---

## 4. WhatsApp Business & Resend (Comunicación)
- **WhatsApp:** Notificaciones transaccionales vía Meta Cloud API.
- **Resend:** Emails con dominio verificado (`@antigravity.co`).
- **Control:** Rate limit estricto con Upstash para evitar bloqueos por spam.

---

## 5. Monitoreo Integral (Sentry)
- **Configuración:** Capturar excepciones con contexto de `tenant_id` y `user_role`.
- **Alertas:** Enviar a Slack ante errores críticos de integración (5xx de proveedores).

---

## checklist de integración
---

## 🔐 WEBHOOK SECURITY & HMAC MASTERY

**Regla de Oro:** Validar siempre la firma para evitar ataques de suplantación.

### Patrón Seguro (v5.5.0)

```typescript
// src/app/api/webhooks/mercadopago/route.ts
import crypto from 'crypto'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('x-signature')
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET

  if (!secret && process.env.NODE_ENV === 'production') {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Validar HMAC
  const expectedSignature = crypto
    .createHmac('sha256', secret!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Procesar evento de forma segura e idempotente
  const event = JSON.parse(body)
  const { data, error } = await supabase.rpc('process_mp_webhook', {
    p_event_id: event.id,
    p_payload: event
  })

  return new Response('OK', { status: 200 })
}
```

### Anti-patrones:
- ❌ **Loguear el body completo en prod:** Contiene datos sensibles (PII).
- ❌ **Procesar sin validación en prod:** Riesgo de fraude financiero.
- ❌ **No manejar idempotencia:** Webhooks pueden enviarse múltiples veces.

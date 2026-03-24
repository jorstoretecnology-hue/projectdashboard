import { createServiceClient } from '@/lib/supabase/service'
import { payments } from './client'
import type { MPWebhookPayload } from './types'
import { logger } from '@/lib/logger'
import type { Json } from '@/lib/supabase/database.types'

// Map de estados de MercadoPago a estados internos
const MP_STATUS_MAP: Record<string, 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded'> = {
  approved: 'approved',
  pending: 'pending',
  in_process: 'pending',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
  charged_back: 'rejected',
}

/**
 * Main Webhook Handler for MercadoPago.
 * Usa el cliente de servicio (service_role) para operar sin restricciones de RLS,
 * ya que los webhooks llegan sin sesión de usuario autenticado.
 */
export async function handleMPWebhook(payload: MPWebhookPayload) {
  // ⚠️ CRÍTICO: Usamos createServiceClient (bypass RLS) para que el webhook
  // pueda escribir en webhook_events y actualizar payments/subscriptions.
  const supabase = createServiceClient()

  // 1. Registrar el evento crudo para auditoría
  const { data: event, error: logError } = await supabase
    .from('webhook_events')
    .insert({
      source: 'mercadopago',
      external_id: payload.data?.id ?? null,
      topic: payload.type,
      payload: payload as unknown as Json,
      processed: false,
    })
    .select('id')
    .single()

  if (logError || !event) {
    logger.error('[MP Webhook] Error al registrar evento:', logError)
    return { success: false, error: 'Log failed' }
  }

  try {
    // 2. Procesar según el tipo de notificación
    if (payload.type === 'payment' && payload.data?.id) {
      await processPaymentWebhook(payload.data.id, event.id)
    } else {
      logger.log(`[MP Webhook] Tipo no manejado: ${payload.type}`)
    }

    // 3. Marcar como procesado
    await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('id', event.id)

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    logger.error(`[MP Webhook] Error procesando ${payload.data?.id}:`, error)

    await supabase
      .from('webhook_events')
      .update({ error_message: errorMessage })
      .eq('id', event.id)

    return { success: false, error: errorMessage }
  }
}

/**
 * Procesa la actualización de un pago específico.
 * Recupera el pago de MercadoPago y actualiza los registros internos.
 */
async function processPaymentWebhook(mpPaymentId: string, eventLogId: string) {
  const supabase = createServiceClient()

  // Recuperar detalles completos del pago desde MercadoPago
  const mpPayment = await payments.get({ id: mpPaymentId })

  if (!mpPayment) {
    throw new Error(`Pago ${mpPaymentId} no encontrado en MercadoPago`)
  }

  const internalStatus = MP_STATUS_MAP[mpPayment.status ?? ''] ?? 'pending'

  // Actualizar el registro de pago usando mercadopago_payment_id (columna real de la migración)
  const { data: updatedPayment, error: updateError } = await supabase
    .from('payments')
    .update({
      status: internalStatus,
      updated_at: new Date().toISOString(),
      metadata: {
        mp_raw: mpPayment as unknown as Json,
        webhook_event_id: eventLogId,
      } as Json,
    })
    .eq('mercadopago_payment_id', mpPaymentId)
    .select('tenant_id, subscription_id, metadata')
    .single()

  if (updateError) {
    throw updateError
  }

  // Si el pago fue aprobado, actualizar el plan del tenant
  if (internalStatus === 'approved' && updatedPayment) {
    const tenantId = updatedPayment.tenant_id
    const meta = updatedPayment.metadata as Record<string, string> | null
    const targetPlanId =
      (mpPayment.additional_info?.items?.[0]?.id as string | undefined)?.replace('plan-', '') ??
      meta?.targetPlan

    if (targetPlanId) {
      logger.log(`[MP Webhook] Actualizando tenant ${tenantId} al plan ${targetPlanId}`)

      // Actualizar el plan en la tabla tenants
      await supabase
        .from('tenants')
        .update({ plan: targetPlanId as 'free' | 'starter' | 'professional' | 'enterprise' })
        .eq('id', tenantId)

      // Activar la suscripción del tenant
      const now = new Date()
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      await supabase
        .from('subscriptions')
        .update({
          plan_slug: targetPlanId as 'free' | 'starter' | 'professional' | 'enterprise',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('tenant_id', tenantId)
    }
  }

  logger.log(`[MP Webhook] Pago ${mpPaymentId} → estado interno: ${internalStatus}`)
}


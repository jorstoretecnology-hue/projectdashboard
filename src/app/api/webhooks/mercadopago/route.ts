import { NextRequest, NextResponse } from 'next/server';
import { handleMPWebhook } from '@/lib/mercadopago/webhook-handler';
import { logger } from '@/lib/logger';
import { MPWebhookPayload } from '@/lib/mercadopago/types';
import { createHmac } from 'crypto';

/**
 * POST /api/webhooks/mercadopago
 * Handle notifications from MercadoPago
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');
    
    // Verificación de firma (Security Hardening)
    // MercadoPago usa HMAC SHA256 con el webhook secret
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('[MP Webhook] CRITICAL: MERCADOPAGO_WEBHOOK_SECRET missing in production');
        return NextResponse.json({ error: 'Config Error' }, { status: 500 });
      } else {
        logger.warn('[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET not defined. Skipping signature check in dev.');
      }
    } else {
      if (!signature) {
        if (process.env.NODE_ENV === 'production') {
          logger.error('[MP Webhook] Missing signature in production');
          return NextResponse.json({ error: 'Missing Signature' }, { status: 401 });
        } else {
          logger.warn('[MP Webhook] Missing signature in dev. Skipping signature check.');
        }
      } else {
        const parts = signature.split(',');
        const tsPart = parts.find((p: string) => p.startsWith('ts='));
        const v1Part = parts.find((p: string) => p.startsWith('v1='));
        
        if (tsPart && v1Part) {
          const timestamp = tsPart.split('=')[1];
          const hash = v1Part.split('=')[1];
          const manifest = `id:${requestId};request-id:${requestId};ts:${timestamp};`;
          const hmac = createHmac('sha256', webhookSecret);
          hmac.update(manifest);
          const checkHash = hmac.digest('hex');
          
          if (checkHash !== hash) {
            logger.error('[MP Webhook] Invalid Signature detected');
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
          }
        } else {
          logger.error('[MP Webhook] Malformed Signature header');
          return NextResponse.json({ error: 'Invalid Signature Format' }, { status: 401 });
        }
      }
    }

    const payload = JSON.parse(body) as MPWebhookPayload;
    
    logger.log(`[MP Webhook] Received notification type: ${payload.type} for ID: ${payload.data?.id}`);

    // Delegate to service
    const result = await handleMPWebhook(payload);

    if (!result.success) {
      // We still return 200 to MP to avoid retries if it's a known error logged internally
      // but we return 400 if it's a validation error or something MP should retry
      return NextResponse.json({ status: 'logged_with_error', message: result.error }, { status: 200 });
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    logger.error('[MP Webhook] Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET for testing connectivity
 */
export async function GET() {
  return NextResponse.json({ message: 'MercadoPago Webhook Endpoint Active' });
}

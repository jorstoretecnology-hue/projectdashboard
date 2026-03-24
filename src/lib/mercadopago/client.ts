import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { logger } from '@/lib/logger';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  logger.warn('MERCADOPAGO_ACCESS_TOKEN is not defined in environment variables');
}

/**
 * MercadoPago Client Configuration
 */
export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

/**
 * API Modules
 */
export const payments = new Payment(mpClient);
export const preferences = new Preference(mpClient);

/**
 * Helper to validate webhook signatures if MP supports it via SDK 
 * (Note: MP usually sends a x-signature header or similar)
 */
export function validateMPSignature(signature: string, payload: string): boolean {
  // TODO: Implement signature validation logic if required by MP v2
  return true; 
}

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

// Inicializamos Resend solo si hay API Key, para no romper build en dev
export const resend = apiKey ? new Resend(apiKey) : null;

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn("⚠️ FALTA RESEND_API_KEY: Los correos no se enviarán.");
}

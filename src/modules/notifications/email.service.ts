import { resend } from '@/lib/resend';
import { logger } from '@/lib/logger';

export const emailService = {
  async sendWelcomeEmail(email: string, name: string) {
    if (!resend) {
      logger.warn("[EmailService] Resend not configured. Skipping welcome email.");
      return;
    }

    try {
      await resend.emails.send({
        from: 'Acme SaaS <onboarding@resend.dev>', // Change this to your verify domain in prod
        to: email,
        subject: `¡Bienvenido a Acme, ${name}! 🚀`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h1>¡Hola ${name}!</h1>
            <p>Estamos emocionados de que te unas a nosotros.</p>
            <p>Tu espacio de trabajo ya está configurado y listo para usar.</p>
            <br/>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Ir a mi Dashboard
            </a>
            <br/><br/>
            <p>Si tienes alguna pregunta, no dudes en responder a este correo.</p>
            <p>El equipo de Acme</p>
          </div>
        `
      });
      logger.log(`[EmailService] Welcome email sent to ${email}`);
    } catch (error) {
      logger.error("[EmailService] Error sending welcome email:", error);
    }
  },

  async sendInvitationEmail(email: string, inviterName: string, tenantName: string, inviteLink: string) {
    if (!resend) {
      logger.warn("[EmailService] Resend not configured. Skipping invitation email.");
      return;
    }

    try {
      await resend.emails.send({
        from: 'Acme SaaS <invitations@resend.dev>',
        to: email,
        subject: `${inviterName} te ha invitado a unirte a ${tenantName} 🤝`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB;">¡Hola!</h2>
            <p><strong>${inviterName}</strong> te ha invitado a colaborar en la organización <strong>${tenantName}</strong> en Acme SaaS.</p>
            <p>Haz clic en el botón de abajo para aceptar la invitación y configurar tu cuenta:</p>
            <br/>
            <div style="text-align: center;">
              <a href="${inviteLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Aceptar Invitación
              </a>
            </div>
            <br/>
            <p style="font-size: 12px; color: #666;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
              <a href="${inviteLink}">${inviteLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Este es un mensaje automático de Acme SaaS. Si no esperabas esta invitación, puedes ignorar este correo.</p>
          </div>
        `
      });
      logger.log(`[EmailService] Invitation email sent to ${email}`);
    } catch (error) {
      logger.error("[EmailService] Error sending invitation email:", error);
    }
  }
};

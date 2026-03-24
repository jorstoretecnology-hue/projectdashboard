import { SupabaseClient } from "@supabase/supabase-js"
import { Database, Json } from "../../../lib/supabase/database.types"
import { logger } from "../../../lib/logger"

type DomainEvent = Database['public']['Tables']['domain_events']['Row']
type AutomationRule = Database['public']['Tables']['automation_rules']['Row']

export class AutomationExecutorService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Procesa un evento de dominio, busca reglas que coincidan y las ejecuta.
   */
  async processEvent(event: DomainEvent): Promise<void> {
    logger.log(`[Automation] Processing event: ${event.event_type} (${event.id})`);

    // 1. Buscar reglas activas para este tipo de evento
    const { data: rules, error } = await this.supabase
      .from('automation_rules')
      .select('*')
      .eq('event_type', event.event_type)
      .eq('tenant_id', event.tenant_id)
      .eq('is_active', true);

    if (error) {
      logger.error(`[Automation] Error fetching rules: ${error.message}`);
      return;
    }

    if (!rules || rules.length === 0) {
      logger.log(`[Automation] No rules found for ${event.event_type}`);
      return;
    }

    // 2. Para cada regla, verificar condiciones y ejecutar
    for (const rule of rules) {
      try {
        if (this.matchesCondition(event.payload, rule.condition_json)) {
          await this.executeAction(rule, event);
        }
      } catch (err) {
        logger.error(`[Automation] Execution failed for rule ${rule.id}:`, err);
      }
    }
  }

  /**
   * Verifica si el payload del evento cumple con las condiciones de la regla.
   */
  private matchesCondition(payload: Json, condition: Json): boolean {
    if (!condition || typeof condition !== 'object' || Array.isArray(condition)) return true;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;

    const payloadObj = payload as Record<string, any>;
    const conditionObj = condition as Record<string, any>;

    for (const key in conditionObj) {
      if (payloadObj[key] !== conditionObj[key]) return false;
    }
    return true;
  }

  /**
   * Ejecuta la acción definida en la regla.
   */
  private async executeAction(rule: AutomationRule, event: DomainEvent): Promise<void> {
    logger.log(`[Automation] Executing ${rule.action_type} for rule: ${rule.name}`);

    // Registrar inicio de ejecución
    const { data: log, error: logError } = await this.supabase
      .from('automation_logs')
      .insert({
        tenant_id: rule.tenant_id,
        automation_rule_id: rule.id,
        domain_event_id: event.id,
        status: 'PENDING'
      })
      .select('id')
      .single();

    if (logError) {
      logger.error(`[Automation] Could not create execution log: ${logError.message}`);
      return;
    }

    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage: string | null = null;
    let providerResponse: Json | null = null;

    try {
      switch (rule.action_type) {
        case 'WEBHOOK':
          providerResponse = await this.executeWebhook(rule.action_config, event.payload);
          break;
        case 'EMAIL':
          providerResponse = await this.executeEmail(rule.action_config, event.payload);
          break;
        default:
          throw new Error(`Action type ${rule.action_type} not supported`);
      }
    } catch (err: any) {
      status = 'FAILED';
      errorMessage = err.message;
    }

    // Actualizar log final
    await this.supabase
      .from('automation_logs')
      .update({
        status,
        error_message: errorMessage,
        provider_response: providerResponse,
        executed_at: new Date().toISOString()
      })
      .eq('id', log.id);
  }

  private async executeWebhook(config: Json, payload: Json): Promise<Json> {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error("Invalid webhook configuration");
    }

    const configObj = config as Record<string, any>;
    const url = configObj.url;
    if (!url) throw new Error("Webhook URL missing in config");

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    return { status: response.status, ok: true };
  }

  private async executeEmail(config: Json, payload: Json): Promise<Json> {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error("Invalid email configuration");
    }

    const configObj = config as Record<string, any>;
    const to = configObj.to;
    const subject = configObj.subject;
    
    // Aquí se podría usar un sistema de plantillas para inyectar variables del payload
    // Por simplicidad, inyectamos un log crudo si no hay body definido.
    const body = configObj.body || `<p>Se ha disparado un evento de automatización.</p><pre>${JSON.stringify(payload, null, 2)}</pre>`;

    if (!to || !subject) {
      throw new Error("Email 'to' or 'subject' missing in config");
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured on the server");
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Smart Business OS <onboarding@resend.dev>', // Sender genérico hasta tener dominios validados
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: body
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API failed: ${data.message || response.statusText}`);
    }

    return { status: response.status, resend_id: data.id };
  }
}

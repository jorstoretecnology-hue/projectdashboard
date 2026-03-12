import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"

type WebhookSubscriptionRow = Database['public']['Tables']['webhook_subscriptions']['Row']
type WebhookSubscriptionInsert = Database['public']['Tables']['webhook_subscriptions']['Insert']
type WebhookSubscriptionUpdate = Database['public']['Tables']['webhook_subscriptions']['Update']

export interface WebhookSubscription {
  id: string
  tenantId: string
  url: string
  eventType: string
  secret: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export class WebhookService {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  /**
   * Obtiene la lista de suscripciones configuradas en el tenant.
   */
  async list(tenantId: string): Promise<WebhookSubscription[]> {
    const { data, error } = await this.supabaseClient
      .from("webhook_subscriptions" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[WebhookService] List Error:", error)
      throw new Error(`Error al listar webhooks: ${error.message}`)
    }

    return ((data as unknown as WebhookSubscriptionRow[]) || []).map(this.mapToDomain)
  }

  /**
   * Crea una nueva suscripción a un webhook.
   */
  async create(payload: Omit<WebhookSubscriptionInsert, 'tenant_id'>, tenantId: string): Promise<WebhookSubscription> {
    const insertData = {
      ...payload,
      tenant_id: tenantId,
    }

    const { data: newSub, error } = await this.supabaseClient
      .from("webhook_subscriptions" as any)
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      console.error("[WebhookService] Create Error:", error)
      throw new Error(`No se pudo crear el webhook: ${error.message}`)
    }

    const sub = newSub as unknown as WebhookSubscriptionRow

    return this.mapToDomain(sub)
  }

  /**
   * Actualiza el estado o URL de una suscripción.
   */
  async update(id: string, updates: Partial<WebhookSubscriptionUpdate>, tenantId: string): Promise<WebhookSubscription> {
    const { data: updatedSub, error } = await this.supabaseClient
      .from("webhook_subscriptions" as any)
      .update(updates as any)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single()

    if (error) {
      console.error("[WebhookService] Update Error:", error)
      throw new Error("No se pudo actualizar el webhook.")
    }

    return this.mapToDomain(updatedSub as unknown as WebhookSubscriptionRow)
  }

  /**
   * Elimina una suscripción.
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from("webhook_subscriptions" as any)
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[WebhookService] Delete Error:", error)
      throw new Error("No se pudo eliminar el webhook.")
    }
  }

  private mapToDomain(row: WebhookSubscriptionRow): WebhookSubscription {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      url: row.url,
      eventType: row.event_type,
      secret: row.secret,
      isActive: row.is_active ?? true,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at,
    }
  }
}

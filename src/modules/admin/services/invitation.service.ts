import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/types';
import { AuditLogService } from '@/core/security/audit.service';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';

export interface Invitation {
  id: string;
  email: string;
  tenant_id: string;
  app_role: AppRole;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}

export class InvitationService {
  private supabase: SupabaseClient<Database>;
  private audit: AuditLogService;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase || createClient() as unknown as SupabaseClient<Database>;
    this.audit = new AuditLogService(this.supabase);
  }

  /**
   * Crea una nueva invitación y genera un token único
   */
  async createInvitation(data: {
    email: string;
    tenantId: string;
    role: AppRole;
    invitedBy?: string;
  }) {
    // Generar un token aleatorio seguro
    const token = crypto.randomUUID();

    const { data: invitation, error } = await (this.supabase
      .from('invitations' as any) as any)
      .insert({
        email: data.email.toLowerCase().trim(),
        tenant_id: data.tenantId,
        app_role: data.role,
        token: token,
        invited_by: data.invitedBy,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      })
      .select("id, email, tenant_id, app_role, token, status, expires_at, created_at")
      .single();

    if (error) {
      logger.error('[InvitationService] Error creating invitation:', error);
      throw new Error(`Error al crear invitación: ${error.message}`);
    }

    // Auditoría
    await this.audit.log({
      tenantId: data.tenantId,
      action: 'CREATE',
      entityType: 'USER', // Lo tratamos como pre-usuario
      entityId: (invitation as { id: string })?.id,
      newData: { email: data.email, role: data.role }
    });

    return invitation;
  }

  /**
   * Obtiene una invitación por su token y verifica que sea válida
   */
  async getInvitationByToken(token: string) {
    const { data, error } = await (this.supabase
      .from('invitations' as any) as any)
      .select('id, email, tenant_id, app_role, token, status, expires_at, created_at, tenants(name)')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      logger.error('[InvitationService] Invalid or expired token:', error);
      return null;
    }

    return data;
  }

  /**
   * Marca una invitación como aceptada
   */
  async acceptInvitation(id: string) {
    const { error } = await (this.supabase
      .from('invitations' as any) as any)
      .update({ status: 'accepted' })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Lista invitaciones de un tenant
   */
  async listByTenant(tenantId: string) {
    const { data, error } = await (this.supabase
      .from('invitations' as any) as any)
      .select('id, email, app_role, status, expires_at, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

const defaultClient = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) 
  ? createClient() 
  : null as any;

export const invitationService = new InvitationService(defaultClient);

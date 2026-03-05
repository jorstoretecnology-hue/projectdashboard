import { createClient } from "@/lib/supabase/client"

export interface GlobalProfile {
  id: string
  full_name: string | null
  email?: string
  app_role: string
  tenant_id: string | null
  created_at: string
  tenants?: {
    name: string
  } | null
}

export class AdminProfilesService {
  private supabase = createClient()

  async listProfiles() {
    // Nota: Como SuperAdmin, RLS me permite ver todo en profiles
    const { data, error } = await this.supabase
      .from('profiles')
      .select(`
        *,
        tenants (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as GlobalProfile[]
  }

  async updateRole(userId: string, newRole: string) {
    // 1. Actualizar DB
    const { error: dbError } = await this.supabase
      .from('profiles')
      .update({ app_role: newRole })
      .eq('id', userId)

    if (dbError) throw dbError

    // Nota: El trigger en la DB 'on_auth_user_created_update_jwt' se encargará 
    // de actualizar los app_metadata en auth.users automáticamente al detectar el UPDATE en profiles.
    
    return { success: true }
  }

  async deleteProfile(userId: string) {
    // ADVERTENCIA: Esto no borra el usuario de Auth, solo el perfil.
    // Para borrar de Auth se requiere una Edge Function o el admin client (service_role).
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error
    return { success: true }
  }
}

export const adminProfilesService = new AdminProfilesService()

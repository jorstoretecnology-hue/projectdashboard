import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  app_role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER' | string;
  tenant_id: string | null;
  created_at: string;
};

export type Tenant = {
  id: string;
  name: string;
};

interface ApiError extends Error {
  details?: {
    message?: string;
    [key: string]: unknown;
  };
}

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Obtener lista de empresas (tenants)
  const fetchTenants = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('tenants')
        .select('id, name')
        .order('name');
      if (err) throw err;
      setTenants(data || []);
    } catch (err) {
      const error = err as ApiError;
      logger.error('[useUserManagement] Error cargando empresas', { error });
    }
  }, [supabase]);

  // Obtener lista de usuarios desde la tabla profiles
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, full_name, app_role, tenant_id, created_at')
        .order('created_at', { ascending: false });

      if (err) throw err;

      setUsers(data as UserProfile[]);
      logger.log('[useUserManagement] Usuarios cargados exitosamente', { count: data.length });
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
      logger.error('[useUserManagement] Error cargando usuarios', { error });
      toast.error('Error al cargar la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Cambiar el rol de un usuario (Granular)
  const updateUserRole = async (userId: string, newRole: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar rol');

      toast.success(`Rol actualizado a ${newRole}`);
      logger.log(`[useUserManagement] Rol actualizado para ${userId} -> ${newRole}`);
      await fetchUsers(); // Recargar lista
    } catch (err) {
      const error = err as Error;
      logger.error('[useUserManagement] Error actualizando rol', { error });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar empresa de un usuario
  const assignTenant = async (userId: string, tenantId: string | null) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tenantId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al asignar empresa');
      }

      toast.success('Empresa asignada correctamente');
      await fetchUsers();
    } catch (err) {
      const error = err as Error;
      logger.error('[useUserManagement] Error asignando empresa', { error });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nuevo usuario
  const createUser = async (email: string, name: string, role: string, password?: string) => {
    logger.log('[Hook] Iniciando createUser para:', { email, role });
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'Password123!', name, role })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          logger.error('[useUserManagement] Error Details:', JSON.stringify(data.details, null, 2));
          if (data.details.message) logger.error('[useUserManagement] SQL/Auth Message:', data.details.message);
        }
        throw new Error(data.error || 'Error creando usuario');
      }

      toast.success(`Usuario ${email} creado exitosamente.`);
      logger.log(`[useUserManagement] Usuario creado: ${email}`);
      await fetchUsers();
    } catch (err) {
      const error = err as Error;
      logger.error('[useUserManagement] Error creando usuario', { error });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar/Suspender usuario
  const deleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error eliminando usuario');

      toast.success('Usuario eliminado permanentemente');
      logger.log(`[useUserManagement] Usuario eliminado: ${userId}`);
      await fetchUsers();
    } catch (err) {
      const error = err as Error;
      logger.error('[useUserManagement] Error eliminando usuario', { error });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    users,
    tenants,
    isLoading,
    error,
    fetchUsers,
    fetchTenants,
    updateUserRole,
    assignTenant,
    createUser,
    deleteUser
  };
}

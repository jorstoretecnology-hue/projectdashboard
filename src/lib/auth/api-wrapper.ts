import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AppRole } from '@/types';
import { apiError } from '@/lib/api/response';
import { hasRole } from './guards';

export type AuthenticatedContext = {
  user: any; // User de Supabase
  tenantId: string;
  userRole: AppRole;
  supabase: any; // SupabaseClient
};

type ApiHandler = (
  req: NextRequest,
  ctx: AuthenticatedContext
) => Promise<NextResponse>;

type AuthOptions = {
  requiredRoles?: AppRole[];
};

/**
 * Higher-Order Function para proteger API Routes.
 * - Verifica sesión de Supabase.
 * - Obtiene tenant_id y user_role (del metadata o DB).
 * - Verifica roles permitidos.
 * - Inyecta contexto autenticado.
 * - Maneja errores globales.
 */
export function withAuth(handler: ApiHandler, options: AuthOptions = {}) {
  return async (req: NextRequest) => {
    try {
      const supabase = await createClient();

      // 1. Verificar sesión
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return apiError('Unauthorized', 'AUTH_REQUIRED', 401);
      }

      // 2. Obtener Tenant y Rol del metadata
      // (Asumimos que el token JWT ya tiene estos datos gracias a custom claims o metadata)
      // Si no, habría que consultar a la DB. Por eficiencia, confiamos en app_metadata primero.
      const appMetadata = user.app_metadata || {};
      const userMetadata = user.user_metadata || {}; 
      
      // NOTA: tenant_id debería estar en app_metadata si usamos custom claims, 
      // o en user_metadata si lo guardamos al login.
      // Fallback: consultar perfil si no está en metadata (más lento).
      
      let tenantId = appMetadata.tenant_id as string;
      let userRole = appMetadata.app_role as AppRole; // O user_metadata.role

      // Si no están en metadata, consultamos perfil (esto agrega latencia, idealmente evitar)
      if (!tenantId || !userRole) {
         const { data: profile } = await supabase
           .from('profiles')
           .select('tenant_id, app_role')
           .eq('id', user.id)
           .single();
         
         if (profile) {
           tenantId = profile.tenant_id;
           userRole = profile.app_role as AppRole;
         }
      }

      if (!tenantId) {
        return apiError('Forbidden: No tenant associated', 'NO_TENANT', 403);
      }
      
      // Default a VIEWER si no tiene rol
      if (!userRole) {
        userRole = 'VIEWER';
      }

      // 3. Verificar Roles
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        if (!hasRole(userRole, options.requiredRoles)) {
           return apiError(
             `Forbidden: Role ${userRole} required one of [${options.requiredRoles.join(', ')}]`,
             'INSUFFICIENT_PERMISSIONS', 
             403
           );
        }
      }

      // 4. Ejecutar Handler
      const ctx: AuthenticatedContext = {
        user,
        tenantId,
        userRole,
        supabase,
      };

      return await handler(req, ctx);

    } catch (error: any) {
      console.error('[API Error]', error);

      // Manejo de errores de validación (Zod)
      if (error.isValidationError || error.name === 'ZodError') {
        return apiError(
          'Validation Error',
          'VALIDATION_ERROR',
          400,
          error.errors || error.issues
        );
      }

      // Manejo de errores de negocio conscientes
      if (error.statusCode && error.code) { // Si lanzamos errores estructurados
          return apiError(error.message, error.code, error.statusCode);
      }

      return apiError(
        error.message || 'Internal Server Error',
        'INTERNAL_ERROR',
        500,
        process.env.NODE_ENV === 'development' ? error.stack : undefined
      );
    }
  };
}

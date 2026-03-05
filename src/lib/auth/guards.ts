import { AppRole } from '@/types';

/**
 * Verifica si un rol tiene acceso basado en una lista de roles permitidos.
 * Retorna true si tiene acceso, false si no.
 */
export function hasRole(userRole: AppRole, allowedRoles: AppRole[]): boolean {
  if (allowedRoles.includes('SuperAdmin' as AppRole)) {
     // Si 'SuperAdmin' está en allowedRoles (aunque el enum real es SUPER_ADMIN), normalizamos
     // Pero mejor usamos los valores del enum exactos:
     // 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
  }
  
  // SuperAdmin siempre tiene acceso a todo (regla implícita de negocio)
  if (userRole === 'SUPER_ADMIN') return true;

  return allowedRoles.includes(userRole);
}

/**
 * Lanza un error si el rol no está permitido.
 * Útil para usar dentro de handlers que no usan el wrapper completo.
 */
export function requireRole(userRole: AppRole, allowedRoles: AppRole[]) {
  if (!hasRole(userRole, allowedRoles)) {
    throw new Error(`Forbidden: Role ${userRole} is not authorized.`);
  }
}

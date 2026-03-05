import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess } from '@/lib/api/response';

async function handler(req: NextRequest, ctx: AuthenticatedContext) {
  // Si llegamos aquí, el usuario está autenticado y token validado
  return apiSuccess({
    message: 'Auth Successful',
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
    },
    tenant: ctx.tenantId,
    role: ctx.userRole,
    timestamp: new Date().toISOString(),
  });
}

// Proteger ruta: Requiere estar logueado (cualquier rol)
export const GET = withAuth(handler);

// Proteger ruta: Requiere ser ADMIN o SUPER_ADMIN
export const POST = withAuth(handler, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN'], // Verifica que coincida con AppRole
});

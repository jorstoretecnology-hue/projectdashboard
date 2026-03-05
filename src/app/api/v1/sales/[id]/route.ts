import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess, apiError } from '@/lib/api/response';
import { SalesService } from '@/modules/sales/sales.service';

/**
 * GET /api/v1/sales/:id
 * Roles: VIEW_SALES
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const service = new SalesService(ctx.supabase, ctx.tenantId);
  const sale = await service.getSaleById(id);

  return apiSuccess(sale);
};

// TODO: Implementar POST /:id/cancel que llame a otro RPC de reversión (fase futura)
// Por ahora solo GET.

export const GET = withAuth(getHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] 
});

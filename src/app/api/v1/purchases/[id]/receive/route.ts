import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess, apiError } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validation';
import { receivePurchaseSchema } from '@/lib/api/schemas/purchases';
import { PurchasesService } from '@/modules/purchases/services/purchases.service';

/**
 * POST /api/v1/purchases/:id/receive
 * Recibir mercancía -> Aumentar Stock
 */
const postHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  // Extract ID
  // Path: /api/v1/purchases/[id]/receive
  // Split parts
  const parts = req.nextUrl.pathname.split('/');
  // parts: [ "", "api", "v1", "purchases", "ID", "receive" ]
  const id = parts[parts.length - 2]; 

  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const data = await validateBody(req, receivePurchaseSchema);
  const service = new PurchasesService(ctx.supabase, ctx.tenantId);
  
  const result = await service.receivePurchase(id, ctx.user.id, data.notes);

  return apiSuccess(result);
};

export const POST = withAuth(postHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] 
});

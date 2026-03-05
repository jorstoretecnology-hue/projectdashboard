import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess } from '@/lib/api/response';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { 
  createPurchaseOrderSchema, // Renamed in schemas/purchases.ts? Verify
  purchaseQuerySchema 
} from '@/lib/api/schemas/purchases';
import { PurchasesService } from '@/modules/purchases/purchases.service';

/**
 * GET /api/v1/purchases
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const query = validateQuery(req.nextUrl.searchParams, purchaseQuerySchema);
  const service = new PurchasesService(ctx.supabase, ctx.tenantId);
  const result = await service.getPurchases(query);
  return apiSuccess(result);
};

/**
 * POST /api/v1/purchases
 * Crear orden de compra
 */
const postHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const data = await validateBody(req, createPurchaseOrderSchema); // Check export name
  const service = new PurchasesService(ctx.supabase, ctx.tenantId);
  
  const result = await service.createPurchase(data, ctx.user.id);

  return apiSuccess(result, 201);
};

export const GET = withAuth(getHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] 
});

export const POST = withAuth(postHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] 
});

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess } from '@/lib/api/response';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { createServiceOrderSchema, serviceQuerySchema } from '@/lib/api/schemas/services';
import { ServicesService } from '@/modules/services/services.service';

/**
 * GET /api/v1/services/orders
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const query = validateQuery(req.nextUrl.searchParams, serviceQuerySchema);
  const service = new ServicesService(ctx.supabase, ctx.tenantId);
  const result = await service.getServiceOrders(query);
  return apiSuccess(result);
};

/**
 * POST /api/v1/services/orders
 */
const postHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const data = await validateBody(req, createServiceOrderSchema);
  const service = new ServicesService(ctx.supabase, ctx.tenantId);
  
  const result = await service.createServiceOrder(data, ctx.user.id);

  return apiSuccess(result, 201);
};

export const GET = withAuth(getHandler, { requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] });
export const POST = withAuth(postHandler, { requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE'] });

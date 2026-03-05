import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess } from '@/lib/api/response';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { 
  createSaleSchema, 
  saleQuerySchema 
} from '@/lib/api/schemas/sales';
import { SalesService } from '@/modules/sales/sales.service';

/**
 * GET /api/v1/sales
 * Historial de ventas
 * Roles: VIEW_SALES (ADMIN, EMPLOYEE, VIEWER)
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const query = validateQuery(req.nextUrl.searchParams, saleQuerySchema);
  const service = new SalesService(ctx.supabase, ctx.tenantId);
  const result = await service.getSales(query);
  return apiSuccess(result);
};

/**
 * POST /api/v1/sales
 * Crear venta (Facturación)
 * Roles: CREATE_SALES (ADMIN, OWNER, EMPLOYEE)
 */
const postHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  // 1. Validar Payload (Items, customer, etc)
  const data = await validateBody(req, createSaleSchema);

  // 2. Service (RPC Transaction)
  const service = new SalesService(ctx.supabase, ctx.tenantId);
  
  // Pasamos ctx.user.id para el campo created_by
  const result = await service.createSaleTransaction(data, ctx.user.id);

  return apiSuccess(result, 201);
};

export const GET = withAuth(getHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] 
});

export const POST = withAuth(postHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE'] 
});

import type { NextRequest } from 'next/server';

import { apiSuccess } from '@/lib/api/response';
import { 
  createSaleSchema, 
  saleQuerySchema 
} from '@/lib/api/schemas/sales';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { withAuth } from '@/lib/auth/api-wrapper';
import type { AuthenticatedContext } from '@/lib/auth/api-wrapper';
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

  // 1.5 Validar estado de suscripción (Subscription Guard)
  const { data: subData, error: subError } = await ctx.supabase
    .from('subscriptions')
    .select('status')
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (!subError && subData) {
    if (subData.status === 'past_due' || subData.status === 'unpaid' || subData.status === 'canceled') {
      return new Response(JSON.stringify({ 
        error: "ACCESO_DENEGADO: Tu suscripción está inactiva o presenta un pago pendiente. Módulo bloqueado." 
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

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

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess, apiError } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validation';
import { createServiceItemSchema, updateServiceOrderSchema } from '@/lib/api/schemas/services'; // Check schema export
import { ServicesService } from '@/modules/services/services/services.service';

/**
 * POST /api/v1/services/orders/:id/items
 * Agregar Item (Part/Labor)
 */
const postItemsHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').slice(-2)[0]; // .../orders/[id]/items
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const data = await validateBody(req, createServiceItemSchema);
  const service = new ServicesService(ctx.supabase, ctx.tenantId);
  
  const result = await service.addServiceItem(id, data);
  return apiSuccess(result, 201);
};

// PATCH /api/v1/services/orders/:id/status ? No, mejor endpoint separado o usar el general PUT.
// Aquí implementamos el PUT general para updates de estado y cierre.

/**
 * PUT /api/v1/services/orders/:id
 * Actualizar Orden (Estado, Diagnostico, etc)
 */
const putHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const data = await validateBody(req, updateServiceOrderSchema);
  const service = new ServicesService(ctx.supabase, ctx.tenantId);

  // Si el cambio de estado es a FINAL (REPARADO/ENTREGADO), usar RPC de cierre
  if (data.state && (data.state === 'REPARADO' || data.state === 'ENTREGADO')) {
      const result = await service.completeService(id, ctx.user.id, data.state);
      return apiSuccess(result);
  }

  // Update normal (SQL Update) - No implementado en service todavía explícitamente como método 'update'.
  // TODO: Agregar updateServiceOrder a Service. Por ahora lanzamos error si no es cierre.
  // O implementar update generico.
  return apiError('Generic update not implemented yet. Only state completion.', 'NOT_IMPLEMENTED', 501);
};

export const POST = withAuth(postItemsHandler, { requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE'] });
export const PUT = withAuth(putHandler, { requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE'] });

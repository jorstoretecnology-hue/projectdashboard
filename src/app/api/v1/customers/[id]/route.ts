import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess, apiError } from '@/lib/api/response';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { updateCustomerSchema } from '@/lib/api/schemas/customers';
import { CustomersService } from '@/modules/customers/customers.service';

/**
 * GET /api/v1/customers/:id
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const service = new CustomersService(ctx.supabase, ctx.tenantId);
  const customer = await service.getCustomerById(id);

  return apiSuccess(customer);
};

/**
 * PUT /api/v1/customers/:id
 */
const putHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const data = await validateBody(req, updateCustomerSchema);
  const service = new CustomersService(ctx.supabase, ctx.tenantId);
  const updatedCustomer = await service.updateCustomer(id, data);

  return apiSuccess(updatedCustomer);
};

/**
 * DELETE /api/v1/customers/:id
 */
const deleteHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const service = new CustomersService(ctx.supabase, ctx.tenantId);
  await service.deleteCustomer(id);

  return apiSuccess({ message: 'Customer deleted' });
};

export const GET = withAuth(getHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] 
});

export const PUT = withAuth(putHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE'] 
});

export const DELETE = withAuth(deleteHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] 
});

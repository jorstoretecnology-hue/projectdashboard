import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess } from '@/lib/api/response';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { 
  createCustomerSchema, 
  customerQuerySchema 
} from '@/lib/api/schemas/customers';
import { EnhancedCustomersService as CustomersService } from '@/modules/customers/services/customers.service';

/**
 * GET /api/v1/customers
 * Listar clientes con filtros B2B
 * Roles: VIEW_CUSTOMERS (ADMIN, EMPLOYEE, VIEWER)
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const query = validateQuery(req.nextUrl.searchParams, customerQuerySchema);
  const service = new CustomersService(ctx.supabase, ctx.tenantId);
  const result = await service.getCustomers(query);
  return apiSuccess(result);
};

/**
 * POST /api/v1/customers
 * Crear cliente
 * Roles: MANAGE_CUSTOMERS (ADMIN, OWNER, EMPLOYEE - Vendedores pueden crear clientes)
 */
const postHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const data = await validateBody(req, createCustomerSchema);
  const service = new CustomersService(ctx.supabase, ctx.tenantId);
  const newCustomer = await service.createCustomer(data);
  return apiSuccess(newCustomer, 201);
};

export const GET = withAuth(getHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] 
});

export const POST = withAuth(postHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE'] 
});

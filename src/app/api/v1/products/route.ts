import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess, apiError } from '@/lib/api/response';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { 
  createProductSchema, 
  productQuerySchema 
} from '@/lib/api/schemas/products';
import { ProductsService } from '@/modules/products/services/products.service';

/**
 * GET /api/v1/products
 * Listar productos con filtros
 * Roles: VIEW_PRODUCTS (ADMIN, EMPLOYEE, VIEWER)
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  // 1. Validar Query Params
  const query = validateQuery(req.nextUrl.searchParams, productQuerySchema);
  
  // 2. Instanciar servicio
  const service = new ProductsService(ctx.supabase, ctx.tenantId);

  // 3. Ejecutar lógica
  const result = await service.getProducts(query);

  return apiSuccess(result);
};

/**
 * POST /api/v1/products
 * Crear producto
 * Roles: MANAGE_PRODUCTS (ADMIN, OWNER)
 */
const postHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  // 1. Validar Body
  const data = await validateBody(req, createProductSchema);

  // 2. Instanciar servicio
  const service = new ProductsService(ctx.supabase, ctx.tenantId);

  // 3. Ejecutar lógica
  const newProduct = await service.createProduct(data);

  return apiSuccess(newProduct, 201);
};

// Exportar handlers protegidos
export const GET = withAuth(getHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] 
});

export const POST = withAuth(postHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] 
});

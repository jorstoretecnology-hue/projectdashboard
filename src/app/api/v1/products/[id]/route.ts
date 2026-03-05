import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedContext } from '@/lib/auth/api-wrapper';
import { apiSuccess, apiError } from '@/lib/api/response';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { updateProductSchema } from '@/lib/api/schemas/products';
import { ProductsService } from '@/modules/products/products.service';

/**
 * GET /api/v1/products/:id
 */
const getHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  // Extraer ID de la URL (Next.js App Router pasa params pero aquí usamos el path)
  // Workaround: extraer manualmente si el wrapper oculta params, 
  // pero el handler estándar de Next recibe { params } como segundo arg.
  // Nuestro wrapper `withAuth` modifica la firma.
  // Ajuste: `withAuth` debería pasar params si existen, o leemos de last segment.
  
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const service = new ProductsService(ctx.supabase, ctx.tenantId);
  const product = await service.getProductById(id);

  return apiSuccess(product);
};

/**
 * PUT /api/v1/products/:id
 */
const putHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const data = await validateBody(req, updateProductSchema);
  const service = new ProductsService(ctx.supabase, ctx.tenantId);
  const updatedProduct = await service.updateProduct(id, data);

  return apiSuccess(updatedProduct);
};

/**
 * DELETE /api/v1/products/:id
 */
const deleteHandler = async (req: NextRequest, ctx: AuthenticatedContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return apiError('Invalid ID', 'BAD_REQUEST', 400);

  const service = new ProductsService(ctx.supabase, ctx.tenantId);
  await service.deleteProduct(id);

  return apiSuccess({ message: 'Product deleted' });
};

// Roles: TODOS (GET)
export const GET = withAuth(getHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'] 
});

// Roles: ADMIN/OWNER (PUT)
export const PUT = withAuth(putHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] 
});

// Roles: OWNER (DELETE - Crítico)
export const DELETE = withAuth(deleteHandler, { 
  requiredRoles: ['SUPER_ADMIN', 'OWNER'] 
});

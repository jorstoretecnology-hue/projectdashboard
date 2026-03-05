import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Valida el cuerpo JSON de un request contra un esquema Zod.
 * Retorna los datos parseados o lanza un error controlado.
 */
export async function validateBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        isValidationError: true,
        errors: error.issues || error.errors, // Versiones de Zod varían, aseguramos compatiblidad
      };
    }
    throw new Error('Invalid JSON body');
  }
}

/**
 * Valida los searchParams de la URL contra un esquema Zod.
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return schema.parse(params);
  } catch (error) {
     if (error instanceof z.ZodError) {
      throw {
        isValidationError: true,
        errors: error.issues || error.errors,
      };
    }
    throw new Error('Invalid query parameters');
  }
}

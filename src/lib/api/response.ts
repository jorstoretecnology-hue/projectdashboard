import { NextResponse } from 'next/server';

/**
 * Estructura estándar de respuesta API (JSend-ish)
 */
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
};

/**
 * Retorna una respuesta de éxito (200 OK)
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Retorna una respuesta de error (400, 401, 403, 500, etc.)
 */
export function apiError(
  message: string,
  code: string,
  status = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

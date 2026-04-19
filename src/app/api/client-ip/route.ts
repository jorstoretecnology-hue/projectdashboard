import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // Intentar obtener la IP de los headers en Vercel/proxies
  let ip = _req.headers.get('x-forwarded-for') ||
           _req.headers.get('x-real-ip') ||
           _req.ip || 
           '127.0.0.1'

  // Si hay múltiples IPs en x-forwarded-for (ej: proxies), tomar la primera (cliente)
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }

  return NextResponse.json({ ip })
}

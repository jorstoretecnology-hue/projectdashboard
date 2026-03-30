import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { signature, document, delivered_at } = await req.json()
    const supabase = await createClient()

    // 1. Rate Limit Check (p_ip para prevenir abusos)
    const headerList = await headers()
    const ip = headerList.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1"
    
    const { data: isAllowed, error: limitError } = await (supabase as any).rpc('check_tracking_rate_limit', { p_ip: ip })
    if (limitError || isAllowed === false) {
      console.warn(`Rate limit entry block for IP: ${ip}`)
      return apiError("Demasiados intentos desde esta IP. Por favor espera un minuto.", "RATE_LIMIT_EXCEEDED", 429)
    }

    // 2. Validar que la venta existe y obtener tenant_id para storage (usando vista segura)
    const { data: saleData, error: saleError } = await (supabase as any)
      .from('v_sales_tracking')
      .select('id, tenant_id')
      .eq('tracking_token', token)
      .single()

    if (saleError || !saleData) return apiError("Orden no encontrada o token inválido", "NOT_FOUND", 404)

    const saleId = saleData.id

    // 2. Procesar la firma (base64 a Buffer)
    const base64Data = signature.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `${saleData.tenant_id}/${saleId}_signature.png`

    // 3. Subir a Storage
    const { error: uploadError } = await supabase
      .storage
      .from('signatures')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return apiError("Error al guardar la firma", "STORAGE_ERROR", 500)
    }

    // 4. Obtener URL de la firma
    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(fileName)

    const signatureUrl = publicUrl

    // 5. Actualizar la venta via RPC (SECURITY DEFINER)
    // Cast to any to bypass missing type definition in Database interface
    const { data: resultRaw, error: rpcError } = await (supabase as any)
      .rpc('register_public_delivery', {
        p_token: token,
        p_signature_url: signatureUrl,
        p_document: document,
        p_delivered_at: delivered_at
      })

    const result = resultRaw as { success: boolean; error?: string; sale_id?: string }

    if (rpcError || !result?.success) {
      return apiError(result?.error || "Error al registrar entrega", "DB_ERROR", 500)
    }

    return apiSuccess({ success: true, url: signatureUrl })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return apiError(message, "INTERNAL_ERROR", 500)
  }
}

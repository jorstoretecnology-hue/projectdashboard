// v3 - Permanent Fix for Supabase Server Client
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { signature, document, delivered_at } = await req.json()
    const supabase = await createClient()

    // 1. Validar que la venta existe y está lista para entrega
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('id, tenant_id, metadata, state')
      .eq('id', id)
      .single()

    if (fetchError || !sale) return apiError("Orden no encontrada", "NOT_FOUND", 404)

    if (!['REPARADO', 'PAGADO', 'ENTREGADO'].includes(sale.state)) {
      return apiError("La orden no está lista para entrega", "INVALID_STATE", 422)
    }

    if (typeof signature === 'string' && signature.length > 500_000) {
      return apiError("Firma demasiado grande", "PAYLOAD_TOO_LARGE", 413)
    }

    // 2. Procesar la firma (base64 a Buffer)
    const base64Data = signature.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `${sale.tenant_id}/${id}_signature.png`

    // 3. Subir a Storage
    const { data: uploadData, error: uploadError } = await supabase
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

    // 4. Obtener URL firmada (24 horas)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('signatures')
      .createSignedUrl(fileName, 86400) // 24 horas

    if (signedError) {
      console.error("Signed URL error:", signedError)
      return apiError("Error generando URL de firma", "STORAGE_ERROR", 500)
    }

    const signatureUrl = signedData.signedUrl

    // 5. Actualizar la venta
    const updatedMetadata = {
      ...(sale.metadata || {}),
      delivery_signature_url: signatureUrl,
      delivery_document: document,
      delivered_at: delivered_at
    }

    const { error: updateError } = await supabase
      .from('sales')
      .update({
        state: 'ENTREGADO',
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) return apiError("Error al actualizar la orden", "DB_ERROR", 500)

    return apiSuccess({ success: true, url: signatureUrl })

  } catch (error: any) {
    return apiError(error.message, "INTERNAL_ERROR", 500)
  }
}

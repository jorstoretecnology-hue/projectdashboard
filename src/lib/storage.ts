import { createClient } from '@/lib/supabase/server'

interface UploadImageOptions {
  bucket: string
  path: string
  file: Buffer | Blob
  contentType?: string
}

/**
 * Sube una imagen a Supabase Storage y retorna la URL firmada o pública.
 * Siguiendo el requerimiento de la Tarea #10
 */
export async function uploadImage({ bucket, path, file, contentType = 'image/jpeg' }: UploadImageOptions) {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true
    })

  if (error) throw error

  return data.path
}

/**
 * Genera una URL firmada para una ruta de archivo.
 * Recomendado para firmas y documentos sensibles.
 */
export async function getSignedImageUrl(bucket: string, path: string, expiresIn = 3600) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

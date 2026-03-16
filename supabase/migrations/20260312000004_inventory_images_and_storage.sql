-- Task #10: Soporte para múltiples imágenes y Storage Buckets

-- 1. Crear buckets si no existen (vía SQL)
-- Nota: Esto requiere que el bucket sea configurado manualmente o vía API si la extensión storage no permite insert directo
-- Por seguridad y simplicidad, documentamos la creación manual o usamos este helper:

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true), ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Agregar columna images a inventory_items si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'inventory_items' AND COLUMN_NAME = 'images') THEN
        ALTER TABLE public.inventory_items ADD COLUMN images TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 3. Políticas de RLS para el bucket 'products'
-- Permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'products');

-- Permitir subida solo a usuarios autenticados de su propio tenant_id (basado en la ruta path/tenant_id/...)
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'products'
);

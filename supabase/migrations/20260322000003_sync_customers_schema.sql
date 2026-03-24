-- Fase 13 Patch: Sincronización de esquema de Customers
-- Objetivo: Agregar campos faltantes detectados en auditoría (identificación, ciudad, metadata)

-- 1. Agregar columnas si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'identification_type') THEN
        ALTER TABLE public.customers ADD COLUMN identification_type TEXT DEFAULT 'CC';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'identification_number') THEN
        ALTER TABLE public.customers ADD COLUMN identification_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
        ALTER TABLE public.customers ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'metadata') THEN
        ALTER TABLE public.customers ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_name') THEN
        ALTER TABLE public.customers ADD COLUMN company_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tax_id') THEN
        ALTER TABLE public.customers ADD COLUMN tax_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'website') THEN
        ALTER TABLE public.customers ADD COLUMN website TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.customers ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Crear índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_customers_id_number ON public.customers(identification_number);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON public.customers(tax_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- 3. Actualizar la política RLS para incluir deleted_at si no estaba ya (Fase 13 ya lo hace pero aseguramos)
DROP POLICY IF EXISTS "customers_granular_isolation" ON public.customers;

CREATE POLICY "customers_granular_isolation" ON public.customers
  FOR ALL
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role' IN ('OWNER', 'ADMIN', 'superadmin'))
      OR 
      location_id IN (
        SELECT location_id 
        FROM public.user_locations 
        WHERE user_id = auth.uid() 
          AND is_active = true
      )
      OR
      location_id IS NULL
    )
    AND deleted_at IS NULL
  );

COMMENT ON COLUMN public.customers.identification_type IS 'Tipo de documento (CC, NIT, CE, etc)';
COMMENT ON COLUMN public.customers.identification_number IS 'Número de documento de identidad';
COMMENT ON COLUMN public.customers.city IS 'Ciudad de residencia/operación';
COMMENT ON COLUMN public.customers.metadata IS 'Datos adicionales flexibles para la industria';

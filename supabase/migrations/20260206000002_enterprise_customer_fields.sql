-- ============================================================================
-- MIGRACION: CAMPOS ENTERPRISE PARA CLIENTES
-- ============================================================================

-- 1. Añadir columnas a la tabla customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT, -- RUC / NIT / DNI / VAT
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead')),
ADD COLUMN IF NOT EXISTS website TEXT;

-- 2. Comentarios de las columnas
COMMENT ON COLUMN public.customers.company_name IS 'Nombre de la empresa o razón social';
COMMENT ON COLUMN public.customers.tax_id IS 'Identificación fiscal del cliente para facturación';
COMMENT ON COLUMN public.customers.address IS 'Dirección física o de facturación';
COMMENT ON COLUMN public.customers.notes IS 'Observaciones y detalles internos sobre el cliente';
COMMENT ON COLUMN public.customers.status IS 'Estado del ciclo de vida del cliente (active, inactive, lead)';
COMMENT ON COLUMN public.customers.website IS 'Sitio web del cliente/empresa';

-- 3. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON public.customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON public.customers(tax_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- ============================================================================
-- COMPLETADO
-- ============================================================================

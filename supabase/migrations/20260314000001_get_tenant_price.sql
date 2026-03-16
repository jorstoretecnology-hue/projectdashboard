-- ============================================================================
-- RPC: Obtener Precio para Tenant
-- Propósito: Calcular precio real considerando industria, plan y ciclo de facturación
-- ============================================================================

DROP FUNCTION IF EXISTS get_tenant_price(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_tenant_price(
  p_tenant_id UUID,
  p_plan_slug TEXT,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS NUMERIC AS $$
DECLARE
  v_base_price NUMERIC;
  v_industry TEXT;
  v_discount NUMERIC := 0;
BEGIN
  -- Obtener industria del tenant
  SELECT industry_type INTO v_industry
  FROM public.tenants WHERE id = p_tenant_id;

  -- Obtener precio base del plan
  IF p_billing_cycle = 'yearly' THEN
    SELECT price_yearly INTO v_base_price
    FROM public.plans WHERE slug = p_plan_slug;
  ELSE
    SELECT price_monthly INTO v_base_price
    FROM public.plans WHERE slug = p_plan_slug;
  END IF;

  -- Si no existe el plan, retornar 0
  IF v_base_price IS NULL THEN
    RETURN 0;
  END IF;

  -- Aquí se pueden agregar descuentos específicos por industria
  -- Ejemplo: Talleres tienen 10% de descuento
  IF v_industry = 'taller' THEN
    v_discount := v_base_price * 0.10;
  END IF;

  -- Retornar precio final
  RETURN v_base_price - v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tenant_price IS 'Calcula el precio real para un tenant considerando industria, plan y ciclo de facturación';

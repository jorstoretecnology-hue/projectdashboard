BEGIN;

CREATE OR REPLACE FUNCTION public.get_safe_tracking_data(p_token TEXT, p_ip INET)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale RECORD;
  v_items JSONB;
  v_is_allowed BOOLEAN;
BEGIN
  -- 1. Rate limit
  v_is_allowed := public.check_tracking_rate_limit(p_ip);
  IF NOT v_is_allowed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded');
  END IF;

  -- 2. JOIN directo sin vista
  SELECT
    s.id,
    s.tracking_token,
    s.state,
    s.created_at,
    s.updated_at,
    s.total,
    s.subtotal,
    s.tenant_id,
    CASE
      WHEN c.name IS NOT NULL THEN
        substring(c.name from 1 for 1) || '***' ||
        substring(c.name from length(c.name) for 1)
      ELSE 'Cliente Registrado'
    END as customer_display
  INTO v_sale
  FROM public.sales s
  JOIN public.customers c ON s.customer_id = c.id
  WHERE s.tracking_token = p_token
    AND s.deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not found');
  END IF;

  -- 3. Items de la venta
  SELECT json_agg(jsonb_build_object(
    'id', si.id,
    'product_name', si.product_name,
    'quantity', si.quantity,
    'subtotal', si.subtotal
  )) INTO v_items
  FROM public.sale_items si
  WHERE si.sale_id = v_sale.id
    AND si.deleted_at IS NULL;

  -- 4. Retorno seguro
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_sale.id,
      'state', v_sale.state,
      'created_at', v_sale.created_at,
      'updated_at', v_sale.updated_at,
      'total', v_sale.total,
      'subtotal', v_sale.subtotal,
      'customer_display', v_sale.customer_display,
      'items', COALESCE(v_items, '[]'::jsonb)
    )
  );
END;
$$;

COMMIT;

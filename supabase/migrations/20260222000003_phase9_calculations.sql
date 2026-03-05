-- =============================================================================
-- Migración 20260222000003: Automatización de Cálculos Financieros (DB Side) - REVISADA
-- =============================================================================

-- 0. ASEGURAR COLUMNA 'discount' EN SALES (Defensivo)
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'discount') THEN
            ALTER TABLE public.sales ADD COLUMN discount NUMERIC(15,2) DEFAULT 0 CHECK (discount >= 0);
        END IF;
    END IF;
END $$;

-- 1. FUNCIÓN: fn_calculate_sale_totals()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_calculate_sale_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_sale_id UUID;
    v_subtotal NUMERIC(15,2);
    v_tax NUMERIC(15,2);
    v_total NUMERIC(15,2);
BEGIN
    -- Soportar INSERT, UPDATE, DELETE
    IF (TG_OP = 'DELETE') THEN
        v_sale_id := OLD.sale_id;
    ELSE
        v_sale_id := NEW.sale_id;
    END IF;

    -- Calcular agregados
    -- Usamos el tax_rate definido en el catálogo unificado de productos
    SELECT 
        COALESCE(SUM(si.subtotal), 0),
        COALESCE(SUM(si.quantity * si.unit_price * COALESCE(p.tax_rate, 0)), 0)
    INTO v_subtotal, v_tax
    FROM public.sale_items si
    JOIN public.products p ON si.product_id = p.id
    WHERE si.sale_id = v_sale_id;

    -- Actualizar el header de la venta
    UPDATE public.sales
    SET 
        subtotal = v_subtotal,
        tax = v_tax,
        total = (v_subtotal + v_tax) - COALESCE(discount, 0), -- Descuento es a nivel de factura global
        updated_at = NOW()
    WHERE id = v_sale_id;

    RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APLICAR TRIGGER A SALE_ITEMS
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_calculate_sale_totals ON public.sale_items;
CREATE TRIGGER trg_calculate_sale_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_sale_totals();

-- 3. APLICAR TRIGGER A SALES (Para cuando cambia el descuento global)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sync_sale_total_on_discount()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.discount IS DISTINCT FROM OLD.discount) THEN
        NEW.total := (NEW.subtotal + NEW.tax) - COALESCE(NEW.discount, 0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_sale_total_on_discount ON public.sales;
CREATE TRIGGER trg_sync_sale_total_on_discount
    BEFORE UPDATE OF discount ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_sale_total_on_discount();

-- Comentarios
COMMENT ON FUNCTION public.fn_calculate_sale_totals() IS 'Automatiza el cálculo de impuestos y totales basándose en el catálogo de productos';

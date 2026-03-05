-- =============================================================================
-- Migración: Sincronización de Esquema para Items de Venta (SALE_ITEMS)
-- Objetivo: Asegurar campos de snapshot de producto.
-- =============================================================================

DO $$
BEGIN
    -- 1. product_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'product_name') THEN
        ALTER TABLE sale_items ADD COLUMN product_name VARCHAR(255);
    END IF;

    -- 2. product_sku
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'product_sku') THEN
        ALTER TABLE sale_items ADD COLUMN product_sku VARCHAR(100);
    END IF;

    -- 3. unit_price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'unit_price') THEN
        ALTER TABLE sale_items ADD COLUMN unit_price NUMERIC(15,2) DEFAULT 0;
    END IF;

    -- 4. quantity (ya debería estar pero aseguramos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'quantity') THEN
        ALTER TABLE sale_items ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;

    -- 5. subtotal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'subtotal') THEN
        ALTER TABLE sale_items ADD COLUMN subtotal NUMERIC(15,2) DEFAULT 0;
    END IF;
END $$;

-- =============================================================================
-- Migración: Sincronización de Esquema Financiero para Ventas
-- Objetivo: Agregar columnas de montos faltantes en la tabla 'sales'.
-- =============================================================================

DO $$
BEGIN
    -- 1. Subtotal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'subtotal') THEN
        ALTER TABLE sales ADD COLUMN subtotal NUMERIC(15,2) DEFAULT 0;
    END IF;

    -- 2. Tax
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'tax') THEN
        ALTER TABLE sales ADD COLUMN tax NUMERIC(15,2) DEFAULT 0;
    END IF;

    -- 3. Discount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount') THEN
        ALTER TABLE sales ADD COLUMN discount NUMERIC(15,2) DEFAULT 0;
    END IF;

    -- 4. Payment Method
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'payment_method') THEN
        ALTER TABLE sales ADD COLUMN payment_method VARCHAR(50);
    END IF;

    -- 5. Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'notes') THEN
        ALTER TABLE sales ADD COLUMN notes TEXT;
    END IF;
END $$;

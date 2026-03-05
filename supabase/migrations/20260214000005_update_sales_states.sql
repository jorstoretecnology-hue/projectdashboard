-- =============================================================================
-- Migración 07: Sincronización de Estados de Venta
-- Descripción: Agrega 'EN_PROCESO' a la restricción de estados de sales.
-- =============================================================================

-- 1. Eliminar la restricción antigua (buscamos el nombre por defecto o lo forzamos)
-- Nota: En Postgres si no se nombró, suele ser 'sales_state_check'
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_state_check;

-- 2. Re-crear la restricción con los nuevos estados permitidos
ALTER TABLE sales 
ADD CONSTRAINT sales_state_check 
CHECK (state IN ('COTIZACION', 'PENDIENTE', 'EN_PROCESO', 'PAGADO', 'ENTREGADO', 'RECHAZADO', 'CANCELADA'));

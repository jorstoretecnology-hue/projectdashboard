-- =============================================================================
-- Migración: 20260401000004_fix_cross_tenant_functions.sql
-- Descripción: Corrige vulnerabilidades cross-tenant en funciones SECURITY DEFINER
-- Fecha: 4 de abril 2026
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- FIX #1: get_sale_id_by_token(uuid)
-- Problema: No filtra por tenant_id — cualquier usuario puede obtener 
--           el ID de una venta de otro tenant con solo conocer el token.
-- Solución: Agregar filtro AND s.tenant_id = public.get_current_user_tenant_id()
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_sale_id_by_token(p_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
    v_tenant_id UUID;
BEGIN
    -- Obtener el tenant_id del usuario actual
    v_tenant_id := public.get_current_user_tenant_id();
    
    -- Si no hay tenant_id, no permitir acceso (salvo superadmin)
    IF v_tenant_id IS NULL AND NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Unauthorized: No tenant context';
    END IF;
    
    -- Buscar la venta solo si pertenece al tenant del usuario
    SELECT id INTO v_sale_id
    FROM sales s
    WHERE s.tracking_token = p_token
      AND (v_tenant_id IS NULL OR s.tenant_id = v_tenant_id)
    LIMIT 1;
    
    RETURN v_sale_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- FIX #2: restore_record(target_table, record_id, target_tenant_id)
-- Problema: Acepta target_tenant_id del caller sin verificar que 
--           corresponde al tenant de la sesión activa.
-- Solución: Validar que target_tenant_id coincida con el tenant actual
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.restore_record(
    target_table text, 
    record_id uuid, 
    target_tenant_id uuid
)
RETURNS void AS $$
DECLARE
    v_current_tenant_id UUID;
BEGIN
    -- Obtener el tenant_id de la sesión actual
    v_current_tenant_id := public.get_current_user_tenant_id();
    
    -- Validar que el target_tenant_id coincida con el tenant actual
    -- O que el usuario sea superadmin
    IF target_tenant_id IS DISTINCT FROM v_current_tenant_id 
       AND NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Unauthorized: tenant mismatch in restore_record';
    END IF;
    
    -- Ejecutar la restauración con validación de tenant
    EXECUTE format(
        'UPDATE %I SET deleted_at = NULL WHERE id = $1 AND tenant_id = $2', 
        target_table
    )
    USING record_id, target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Verificación post-migración
-- -----------------------------------------------------------------------------

SELECT 
    'get_sale_id_by_token' as function_name,
    CASE 
        WHEN prosrc LIKE '%get_current_user_tenant_id%' 
        THEN '✓ SECURE (has tenant filter)'
        ELSE '✗ VULNERABLE (missing tenant filter)'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'get_sale_id_by_token' 
  AND n.nspname = 'public';

SELECT 
    'restore_record' as function_name,
    CASE 
        WHEN prosrc LIKE '%tenant mismatch%' 
        THEN '✓ SECURE (has tenant validation)'
        ELSE '✗ VULNERABLE (missing tenant validation)'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'restore_record' 
  AND n.nspname = 'public';

COMMIT;
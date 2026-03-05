-- =============================================================================
-- Migración: 20260305000003_cron_purge_and_rls_test.sql
-- Descripción: Purga automática de logs + Script de test de aislamiento RLS
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 1: PURGA AUTOMÁTICA DE LOGS CON pg_cron
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Función de purga
CREATE OR REPLACE FUNCTION public.purge_old_logs()
RETURNS void AS $$
BEGIN
    -- Purgar webhook_logs con más de 90 días
    DELETE FROM public.webhook_logs
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Purgar audit_logs con más de 1 año (cumplimiento fiscal = 7 años para datos financieros)
    -- Nota: Solo purgamos logs operacionales, no los de tipo BILLING/PLAN_CHANGE
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '365 days'
      AND action NOT IN ('PLAN_CHANGE', 'TENANT_SUSPEND', 'TENANT_REACTIVATE');

    RAISE NOTICE '[purge_old_logs] Limpieza completada a las %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar ejecución diaria a las 3:00 AM UTC
SELECT cron.schedule(
    'purge-old-logs',           -- nombre del job
    '0 3 * * *',                -- cron expression: diario a las 3:00 AM
    $$SELECT public.purge_old_logs()$$
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 2: TEST DE AISLAMIENTO RLS (Ejecutar manualmente para verificar)
-- ═══════════════════════════════════════════════════════════════════════════════
-- ⚠️ INSTRUCCIONES: 
-- Este bloque NO se ejecuta automáticamente. Cópialo y ejecútalo manualmente
-- con dos usuarios de tenants diferentes para validar el aislamiento.
--
-- PASO 1: Como usuario del Tenant A, insertar un cliente:
--   INSERT INTO customers (tenant_id, email, name) 
--   VALUES ('TENANT_A_UUID', 'test@tenanta.com', 'Test Client A');
--
-- PASO 2: Como usuario del Tenant B, intentar leerlo:
--   SELECT * FROM customers WHERE email = 'test@tenanta.com';
--   → Resultado esperado: 0 filas (RLS bloqueó el acceso)
--
-- PASO 3: Limpiar:
--   DELETE FROM customers WHERE email = 'test@tenanta.com';

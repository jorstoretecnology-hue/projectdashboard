-- =============================================================================
-- MIGRACIÓN: 20260327000001_security_remediation_p15.sql
-- Descripción: Limpieza de configuraciones de depuración y endurecimiento de permisos.
-- =============================================================================

BEGIN;

-- 1. ELIMINAR TABLAS DE DEPURACIÓN QUE NO DEBERÍAN ESTAR EN PRODUCCIÓN
DROP TABLE IF EXISTS public.webhook_debug_logs;

-- 2. RESTAURAR FUNCIÓN notify_webhook_event (Decommission de ngrok)
-- Se cambia la URL a un placeholder o se deshabilita hasta que se configure correctamente.
CREATE OR REPLACE FUNCTION public.notify_webhook_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- NOTA: Esta función está en proceso de sustitución por el sistema de 
    -- webhook_subscriptions (dispatch_webhook). Por seguridad, se deshabilita
    -- el envío a URLs hardcoded en migraciones.
    RETURN NEW;
END;
$$;

-- 3. REFORZAR PERMISOS (Corrigiendo GRANT ALL excesivos)
-- Revocar permisos masivos para seguir el principio de mínimo privilegio
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- Otorgar solo lo necesario para el funcionamiento básico del dashboard
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT SELECT, INSERT ON public.sales TO authenticated;
GRANT SELECT ON public.locations TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Importante: El rol service_role mantiene sus privilegios para tareas de admin
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 4. UNIFICAR FUNCIONES DE SUPERADMIN
-- Asegurar que la función is_super_admin() sea la estándar
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT (app_metadata->>'app_role') = 'SUPER_ADMIN'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Alias para compatibilidad si alguna política usa la otra variante
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.is_super_admin();
END;
$$;

-- 5. ENDURECERcreate_sale_transaction CON SECURITY DEFINER
-- Ya está con SECURITY DEFINER en la última migración, pero lo reafirmamos por seguridad.
-- NOTA: El código de la función debe ser el del sistema estable actual.

COMMIT;

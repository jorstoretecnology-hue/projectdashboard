-- Migración: Fase 13 - Parche de Seguridad (DBA Agent)
-- Corrige advertencias de seguridad reportadas por el dashboard de Supabase (UNRESTRICTED)

-- 1. Habilitar RLS en la tabla webhook_debug_logs
ALTER TABLE public.webhook_debug_logs ENABLE ROW LEVEL SECURITY;

-- Opcional: Crear una política para que solo Superadmins puedan leer/borrar los logs
DROP POLICY IF EXISTS "Superadmins controlan webhook logs" ON public.webhook_debug_logs;
CREATE POLICY "Superadmins controlan webhook logs"
ON public.webhook_debug_logs
FOR ALL 
USING ( public.is_superadmin() )
WITH CHECK ( public.is_superadmin() );

-- 2. Asegurar que las vistas asuman la seguridad del invocador
ALTER VIEW public.v_dashboard_stats SET (security_invoker = on);
ALTER VIEW public.view_saas_health SET (security_invoker = on);

-- Mensaje de exito
DO $$
BEGIN
    RAISE NOTICE 'Parche de seguridad aplicado: webhook_debug_logs ahora tiene RLS y las vistas usan security_invoker.';
END $$;

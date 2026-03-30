-- ============================================================
-- Migración: 20260325000006_atomic_quota_increment.sql
-- Propósito: Prevenir race conditions en el QuotaEngine creando
-- funciones RPC atómicas para incrementar y decrementar usos.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_tenant_quota(p_tenant_id uuid, p_resource_key text, p_amount integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.tenant_quotas (tenant_id, resource_key, current_usage, updated_at)
  VALUES (p_tenant_id, p_resource_key, p_amount, NOW())
  ON CONFLICT (tenant_id, resource_key)
  DO UPDATE SET
    current_usage = public.tenant_quotas.current_usage + p_amount,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_tenant_quota(p_tenant_id uuid, p_resource_key text, p_amount integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.tenant_quotas (tenant_id, resource_key, current_usage, updated_at)
  VALUES (p_tenant_id, p_resource_key, 0, NOW())
  ON CONFLICT (tenant_id, resource_key)
  DO UPDATE SET
    current_usage = GREATEST(0, public.tenant_quotas.current_usage - p_amount),
    updated_at = NOW();
END;
$$;

COMMIT;

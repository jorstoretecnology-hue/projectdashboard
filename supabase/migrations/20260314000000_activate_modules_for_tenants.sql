-- ============================================================================
-- RPC: Activar Módulos para Tenant
-- Propósito: Inicializar o actualizar módulos activos según el Plan y la Industria
-- ============================================================================

DROP FUNCTION IF EXISTS activate_modules_for_tenant(UUID, TEXT);

CREATE OR REPLACE FUNCTION activate_modules_for_tenant(
  p_tenant_id UUID,
  p_plan_slug TEXT DEFAULT 'free'
)
RETURNS JSONB AS $$
DECLARE
  v_industry TEXT;
  v_modules TEXT[];
  v_plan_modules TEXT[];
  v_industry_modules TEXT[];
  v_final_modules TEXT[];
  v_module_slug TEXT;
  v_processed_count INTEGER := 0;
BEGIN
  -- 1. Obtener la industria del tenant
  SELECT industry_type INTO v_industry
  FROM public.tenants
  WHERE id = p_tenant_id;

  IF v_industry IS NULL THEN
    v_industry := 'taller'; -- Default
  END IF;

  -- 2. Definir módulos permitidos por PLAN (Tiers)
  -- NOTA: Sincronizado con src/core/billing/plans.ts
  CASE p_plan_slug
    WHEN 'free' THEN 
      v_plan_modules := ARRAY['dashboard', 'inventory'];
    WHEN 'starter' THEN 
      v_plan_modules := ARRAY['dashboard', 'inventory', 'customers'];
    WHEN 'professional' THEN 
      v_plan_modules := ARRAY['dashboard', 'inventory', 'customers', 'users'];
    WHEN 'enterprise' THEN 
      v_plan_modules := ARRAY['dashboard', 'inventory', 'customers', 'users', 'settings'];
    ELSE
      v_plan_modules := ARRAY['dashboard']; -- Fallback mínimo
  END CASE;

  -- 3. Definir módulos por INDUSTRIA
  CASE v_industry
    WHEN 'taller' THEN 
      v_industry_modules := ARRAY['work_orders', 'vehicles'];
    WHEN 'restaurante' THEN 
      v_industry_modules := ARRAY['sales', 'reports']; -- Simplificado para el MVP
    WHEN 'gym' THEN 
      v_industry_modules := ARRAY['customers', 'sales'];
    ELSE
      v_industry_modules := ARRAY[]::TEXT[];
  END CASE;

  -- 4. Mezclar módulos (Plan + Industria)
  v_final_modules := ARRAY_CAT(v_plan_modules, v_industry_modules);
  
  -- Asegurar que Dashboard siempre esté
  IF NOT ('dashboard' = ANY(v_final_modules)) THEN
    v_final_modules := v_final_modules || 'dashboard';
  END IF;

  -- 5. Eliminar duplicados y limpiar
  SELECT ARRAY_AGG(DISTINCT elem) INTO v_final_modules
  FROM UNNEST(v_final_modules) AS elem;

  -- 6. Insertar/Actualizar en tenant_modules
  -- Primero desactivamos todos los que no están en la lista (si ya existían)
  UPDATE public.tenant_modules
  SET is_active = false
  WHERE tenant_id = p_tenant_id;

  -- Activamos los nuevos/existentes
  FOREACH v_module_slug IN ARRAY v_final_modules
  LOOP
    INSERT INTO public.tenant_modules (tenant_id, module_slug, is_active)
    VALUES (p_tenant_id, v_module_slug, true)
    ON CONFLICT (tenant_id, module_slug) 
    DO UPDATE SET is_active = true;
    
    v_processed_count := v_processed_count + 1;
  END LOOP;

  -- 7. Retornar resumen
  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'plan', p_plan_slug,
    'industry', v_industry,
    'modules_activated', v_final_modules,
    'count', v_processed_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Automatización al crear Suscripción
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_module_activation_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM activate_modules_for_tenant(NEW.tenant_id, NEW.plan_slug);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_activate_modules ON public.subscriptions;
CREATE TRIGGER trigger_activate_modules
AFTER INSERT OR UPDATE OF plan_slug ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION handle_module_activation_on_subscription();

-- ============================================================================
-- SCRIPT DE MIGRACIÓN INICIAL (Backfill)
-- ============================================================================

-- Ejecutar esto manualmente en el SQL Editor para activar módulos a tenants existentes
/*
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT t.id, COALESCE(s.plan_slug, 'free') as plan 
              FROM public.tenants t 
              LEFT JOIN public.subscriptions s ON s.tenant_id = t.id)
    LOOP
        PERFORM activate_modules_for_tenant(r.id, r.plan);
    END LOOP;
END $$;
*/

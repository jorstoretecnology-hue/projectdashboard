-- ============================================================================
-- SEGURIDAD: REFUERZO DE SEARCH_PATH Y POLÍTICAS RLS (Hardening v2)
-- ============================================================================

-- 1. LIMPIEZA DE AMBIGÜEDADES (Resolver error "function is not unique")
-- ============================================================================
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

-- 2. REFORZAR FUNCIONES (Prevenir ataques de search_path mutable)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' 
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.validate_quota_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_resource_key TEXT;
    v_current_usage INTEGER;
    v_max_limit INTEGER;
BEGIN
    -- Determinar el recurso basado en la tabla
    IF TG_TABLE_NAME = 'inventory_items' THEN v_resource_key := 'maxInventoryItems';
    ELSIF TG_TABLE_NAME = 'customers' THEN v_resource_key := 'maxCustomers';
    ELSE RETURN NEW;
    END IF;

    -- Obtener estado actual de la quota
    SELECT current_usage, max_limit INTO v_current_usage, v_max_limit
    FROM public.tenant_quotas
    WHERE tenant_id = NEW.tenant_id AND resource_key = v_resource_key;

    -- Si existe límite y se excede, bloquear
    IF v_max_limit > 0 AND v_current_usage >= v_max_limit THEN
        RAISE EXCEPTION 'QUOTA_EXCEEDED: El limite de % (%) ha sido alcanzado.', v_resource_key, v_max_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_quota_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.tenant_quotas (tenant_id, resource_key, current_usage)
        VALUES (
            NEW.tenant_id, 
            CASE 
                WHEN TG_TABLE_NAME = 'inventory_items' THEN 'maxInventoryItems'
                WHEN TG_TABLE_NAME = 'customers' THEN 'maxCustomers'
            END, 
            1
        )
        ON CONFLICT (tenant_id, resource_key) 
        DO UPDATE SET current_usage = public.tenant_quotas.current_usage + 1, updated_at = NOW();
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.tenant_quotas 
        SET current_usage = GREATEST(0, current_usage - 1), updated_at = NOW()
        WHERE tenant_id = OLD.tenant_id AND resource_key = 
            CASE 
                WHEN TG_TABLE_NAME = 'inventory_items' THEN 'maxInventoryItems'
                WHEN TG_TABLE_NAME = 'customers' THEN 'maxCustomers'
            END;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  -- Consultamos el rango real desde profiles
  SELECT app_role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  -- SANEAMIENTO: Limpiamos y construimos los metadatos del JWT
  new.raw_app_meta_data = (COALESCE(new.raw_app_meta_data, '{}'::jsonb) - 'role') || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'user'),
      'tenant_id', u_tenant
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, app_role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- 3. REFORZAR POLÍTICAS RLS (Corregir linter warnings)
-- ============================================================================

-- AUDIT LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit Logs Select Policy" ON public.audit_logs;
CREATE POLICY "Audit Logs Select Policy" ON public.audit_logs 
FOR SELECT USING (tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Audit Logs System Insert" ON public.audit_logs;
CREATE POLICY "Audit Logs System Insert" ON public.audit_logs 
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin())
);

-- CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers Isolation" ON public.customers;
CREATE POLICY "Customers Isolation" ON public.customers
FOR ALL USING (tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin());

-- INVENTORY
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inventory Isolation" ON public.inventory_items;
CREATE POLICY "Inventory Isolation" ON public.inventory_items
FOR ALL USING (tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin());

-- PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products Isolation" ON public.products;
CREATE POLICY "Products Isolation" ON public.products
FOR ALL USING (tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin());

-- 4. NOTIFICACIÓN DE COMPLETADO
-- ============================================================================
COMMENT ON TABLE public.audit_logs IS 'RLS Hardened - Access controlled by tenant_id';
COMMENT ON TABLE public.customers IS 'RLS Hardened - Multi-tenant isolation ensured';
COMMENT ON TABLE public.inventory_items IS 'RLS Hardened - Multi-tenant isolation ensured';
COMMENT ON TABLE public.products IS 'RLS Hardened - Multi-tenant isolation ensured';

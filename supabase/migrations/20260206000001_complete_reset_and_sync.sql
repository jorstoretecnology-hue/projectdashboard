-- ============================================================================
-- RESET COMPLETO Y MIGRACION - Dashboard Universal
-- ============================================================================
-- ADVERTENCIA: Este script ELIMINA todas las tablas y datos existentes
-- Solo ejecutar en entorno de desarrollo
-- ============================================================================

-- 1. LIMPIAR TABLAS EXISTENTES
-- ============================================================================

DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.tenant_quotas CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Limpiar funciones
DROP FUNCTION IF EXISTS public.validate_quota_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.sync_quota_usage() CASCADE;
DROP FUNCTION IF EXISTS public.handle_jwt_claims() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ============================================================================
-- 2. FUNCIONES HELPER
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para obtener tenant_id del JWT
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si es super admin
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.is_super_admin();
    DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
      OR (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

-- ============================================================================
-- 3. TABLA: TENANTS
-- ============================================================================

CREATE TABLE tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    active_modules TEXT[] DEFAULT '{}',
    branding JSONB DEFAULT '{}'::jsonb,
    industry_type VARCHAR(50) NOT NULL CHECK (industry_type IN ('taller', 'restaurante', 'supermercado', 'ferreteria', 'gym', 'glamping', 'discoteca')),
    is_active BOOLEAN DEFAULT true,
    max_users INTEGER DEFAULT 3 CHECK (max_users > 0),
    custom_domain VARCHAR(255),
    feature_flags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tenants_plan ON tenants(plan);
CREATE INDEX idx_tenants_active ON tenants(is_active);
CREATE INDEX idx_tenants_industry_type ON tenants(industry_type);

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_super_admin_full_access ON tenants
    FOR ALL
    USING (is_super_admin());

CREATE POLICY tenants_tenant_own_record ON tenants
    FOR ALL
    USING (id = get_current_user_tenant_id() OR is_super_admin());

-- Trigger
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo
INSERT INTO tenants (id, name, plan, active_modules, branding, industry_type, max_users, custom_domain) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'ACME Corporation', 'enterprise', ARRAY['Dashboard', 'Users', 'Inventory', 'Settings'], '{"primaryColor": "221 83% 53%"}', 'taller', 100, 'acme.dashboard.com'),
('550e8400-e29b-41d4-a716-446655440001', 'TechStart Inc', 'professional', ARRAY['Dashboard', 'Users', 'Inventory'], '{"primaryColor": "142 76% 36%"}', 'supermercado', 50, NULL),
('550e8400-e29b-41d4-a716-446655440006', 'Retail Plus', 'starter', ARRAY['Dashboard', 'Inventory'], '{"primaryColor": "262 83% 58%"}', 'ferreteria', 10, NULL),
('550e8400-e29b-41d4-a716-446655440008', 'Demo Client', 'free', ARRAY['Dashboard'], '{"primaryColor": "346 77% 50%"}', 'gym', 3, NULL),
('550e8400-e29b-41d4-a716-446655440002', 'Global Solutions Ltd', 'enterprise', ARRAY['Dashboard', 'Users', 'Inventory', 'Settings'], '{"primaryColor": "199 89% 48%"}', 'restaurante', 200, 'global.dashboard.com');

-- Actualizar feature_flags
UPDATE tenants SET feature_flags = ARRAY['crm', 'inventory'] WHERE feature_flags = '{}';
UPDATE tenants SET feature_flags = ARRAY['crm', 'inventory', 'billing'] WHERE plan = 'professional' OR plan = 'enterprise';

-- ============================================================================
-- 4. TABLA: PROFILES
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  role TEXT CHECK (role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'staff'::text])),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by users who created them" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_super_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. TABLA: CUSTOMERS
-- ============================================================================

CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers Isolation" ON public.customers
FOR ALL USING (tenant_id = get_current_user_tenant_id() OR is_super_admin());

CREATE POLICY "Customers Update Policy" ON customers 
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Customers Delete Policy" ON customers 
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Trigger
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. TABLA: INVENTORY_ITEMS
-- ============================================================================

CREATE TABLE public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory Isolation" ON public.inventory_items
FOR ALL USING (tenant_id = get_current_user_tenant_id() OR is_super_admin());

CREATE POLICY "Inventory Update Policy" ON inventory_items
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Inventory Delete Policy" ON inventory_items
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Trigger
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. TABLA: TENANT_QUOTAS
-- ============================================================================

CREATE TABLE public.tenant_quotas (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    resource_key TEXT NOT NULL,
    current_usage INTEGER NOT NULL DEFAULT 0,
    max_limit INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, resource_key)
);

-- RLS
ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotas View Access" ON public.tenant_quotas
FOR SELECT USING (tenant_id = get_current_user_tenant_id() OR is_super_admin());

-- ============================================================================
-- 8. TABLA: AUDIT_LOGS
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit Logs Select Policy" ON audit_logs 
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Audit Logs System Insert" ON audit_logs 
FOR INSERT
WITH CHECK (false);

-- ============================================================================
-- 9. TABLA: PRODUCTS (Opcional - Sistema multi-industria)
-- ============================================================================

CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock INTEGER CHECK (stock >= 0),
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    image TEXT,
    industry_type VARCHAR(50) NOT NULL CHECK (industry_type IN ('taller', 'restaurante', 'supermercado', 'ferreteria', 'gym', 'glamping', 'discoteca')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_industry_type ON products(industry_type);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_metadata ON products USING GIN(metadata);
CREATE INDEX idx_products_tenant_isolation ON products(tenant_id, created_at DESC);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation ON products
    FOR ALL
    USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY products_tenant_required ON products
    FOR INSERT
    WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Trigger
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. SISTEMA DE QUOTAS - FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función de validación de quotas
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
$$ LANGUAGE plpgsql;

-- Función de sincronización de uso
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
$$ LANGUAGE plpgsql;

-- Triggers de validación
CREATE TRIGGER tr_check_inventory_quota
BEFORE INSERT ON public.inventory_items
FOR EACH ROW EXECUTE PROCEDURE public.validate_quota_on_insert();

CREATE TRIGGER tr_check_customer_quota
BEFORE INSERT ON public.customers
FOR EACH ROW EXECUTE PROCEDURE public.validate_quota_on_insert();

-- Triggers de sincronización
CREATE TRIGGER tr_sync_inventory_usage
AFTER INSERT OR DELETE ON public.inventory_items
FOR EACH ROW EXECUTE PROCEDURE public.sync_quota_usage();

CREATE TRIGGER tr_sync_customer_usage
AFTER INSERT OR DELETE ON public.customers
FOR EACH ROW EXECUTE PROCEDURE public.sync_quota_usage();

-- ============================================================================
-- 11. JWT CLAIMS - INYECCION DE PERMISOS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
  user_permissions text[];
  user_tenant_id uuid;
  tenant_features text[];
BEGIN
  -- Obtener rol y tenant_id del perfil
  SELECT role, tenant_id INTO user_role, user_tenant_id
  FROM public.profiles
  WHERE id = new.id;

  -- Obtener features del tenant
  IF user_tenant_id IS NOT NULL THEN
    SELECT feature_flags INTO tenant_features
    FROM public.tenants
    WHERE id = user_tenant_id;
  END IF;

  -- Mapear permisos según el rol
  CASE user_role
    WHEN 'superadmin' THEN
      user_permissions := array['customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'inventory.view', 'inventory.manage', 'billing.view', 'billing.manage', 'users.manage', 'settings.edit', 'admin.console'];
    WHEN 'admin' THEN
      user_permissions := array['customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'inventory.view', 'inventory.manage', 'users.manage', 'settings.edit'];
    ELSE
      user_permissions := array['customers.view', 'inventory.view'];
  END CASE;

  -- Inyectar en app_metadata del JWT
  new.raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'app_role', user_role,
      'tenant_id', user_tenant_id,
      'permissions', user_permissions,
      'features', coalesce(tenant_features, '{}'::text[])
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para JWT claims
DROP TRIGGER IF EXISTS on_auth_user_created_update_jwt ON auth.users;
CREATE TRIGGER on_auth_user_created_update_jwt
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_jwt_claims();

-- ============================================================================
-- 12. TRIGGER PARA CREAR PERFIL AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMPLETADO
-- ============================================================================

-- Comentarios de documentación
COMMENT ON TABLE tenants IS 'Tabla de tenants (clientes) con configuración de plan y módulos';
COMMENT ON TABLE customers IS 'Clientes de cada tenant con aislamiento RLS';
COMMENT ON TABLE inventory_items IS 'Inventario de productos/servicios por tenant';
COMMENT ON TABLE tenant_quotas IS 'Sistema de cuotas y límites por plan';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de todas las acciones';
COMMENT ON TABLE products IS 'Productos con configuración multi-industria (opcional)';
COMMENT ON TABLE profiles IS 'Perfiles de usuario vinculados a auth.users';

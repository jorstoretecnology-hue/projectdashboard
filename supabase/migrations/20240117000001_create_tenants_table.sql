-- Create tenants table for plan persistence
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tenants_plan ON tenants(plan);
CREATE INDEX idx_tenants_active ON tenants(is_active);
CREATE INDEX idx_tenants_industry_type ON tenants(industry_type);

-- Row Level Security (RLS) - Multi-tenant isolation
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política: Super Admin tiene acceso total
CREATE POLICY tenants_super_admin_full_access ON tenants
    FOR ALL
    USING (is_super_admin());

-- Política: Tenants solo ven su propio registro (si aplica)
CREATE POLICY tenants_tenant_own_record ON tenants
    FOR ALL
    USING (id = get_current_user_tenant_id() OR is_super_admin());

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data matching the config
INSERT INTO tenants (id, name, plan, active_modules, branding, industry_type, max_users, custom_domain) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'ACME Corporation', 'enterprise', ARRAY['Dashboard', 'Users', 'Inventory', 'Settings'], '{"primaryColor": "221 83% 53%"}', 'taller', 100, 'acme.dashboard.com'),
('550e8400-e29b-41d4-a716-446655440001', 'TechStart Inc', 'professional', ARRAY['Dashboard', 'Users', 'Inventory'], '{"primaryColor": "142 76% 36%"}', 'supermercado', 50, NULL),
('550e8400-e29b-41d4-a716-446655440006', 'Retail Plus', 'starter', ARRAY['Dashboard', 'Inventory'], '{"primaryColor": "262 83% 58%"}', 'ferreteria', 10, NULL),
('550e8400-e29b-41d4-a716-446655440008', 'Demo Client', 'free', ARRAY['Dashboard'], '{"primaryColor": "346 77% 50%"}', 'gym', 3, NULL),
('550e8400-e29b-41d4-a716-446655440002', 'Global Solutions Ltd', 'enterprise', ARRAY['Dashboard', 'Users', 'Inventory', 'Settings'], '{"primaryColor": "199 89% 48%"}', 'restaurante', 200, 'global.dashboard.com');

-- Comments for documentation
COMMENT ON TABLE tenants IS 'Tabla de tenants (clientes) con configuración de plan y módulos';
COMMENT ON COLUMN tenants.plan IS 'Plan de suscripción actual del tenant';
COMMENT ON COLUMN tenants.active_modules IS 'Módulos activos para este tenant';
COMMENT ON COLUMN tenants.branding IS 'Configuración de branding (colores, logos, etc.)';

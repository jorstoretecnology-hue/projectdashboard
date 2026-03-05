-- Create products table with multi-tenant support and industry-specific metadata
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock INTEGER CHECK (stock >= 0), -- NULL for unlimited stock (services)
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    image TEXT,
    industry_type VARCHAR(50) NOT NULL CHECK (industry_type IN ('taller', 'restaurante', 'supermercado', 'ferreteria', 'gym', 'glamping', 'discoteca')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_industry_type ON products(industry_type);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_metadata ON products USING GIN(metadata);

-- Row Level Security (RLS) - Multi-tenant isolation avanzada
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar rol de super admin (Idempotente y Ambiguity-safe)
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.is_super_admin();
    DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Aquí iría la lógica para verificar si el usuario es super admin
  -- Por simplicidad, retornamos false (implementar según tu sistema de roles)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

-- Función helper para obtener tenant_id del usuario actual desde JWT
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política 1: Usuarios normales solo ven productos de su tenant
DROP POLICY IF EXISTS products_tenant_isolation ON products;
CREATE POLICY products_tenant_isolation ON products
    FOR ALL
    USING (
        tenant_id = get_current_user_tenant_id()
    );

-- Política 2: Los usuarios solo pueden insertar productos de su propio tenant
DROP POLICY IF EXISTS products_tenant_required ON products;
CREATE POLICY products_tenant_required ON products
    FOR INSERT
    WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Índices adicionales para optimizar RLS
CREATE INDEX idx_products_tenant_isolation ON products(tenant_id, created_at DESC);
-- COMENTADO: Causa error 42P17 si la función no es determinística o no está bien indexada.
-- CREATE INDEX idx_products_tenant_admin_lookup ON products(id, tenant_id) WHERE is_super_admin();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for different industries
INSERT INTO products (tenant_id, name, description, price, stock, category, industry_type, metadata) VALUES
-- Taller samples
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Filtro de Aceite Yamaha', 'Filtro de aceite original para motocicletas Yamaha', 25.50, 15, 'Repuestos', 'taller', '{"marca": "yamaha", "modelo": "R1", "ano": 2020, "tipo_vehiculo": "moto"}'),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Pastillas de Freno', 'Juego de pastillas de freno para autos Toyota', 45.00, 8, 'Repuestos', 'taller', '{"marca": "toyota", "modelo": "Corolla", "ano": 2019, "tipo_vehiculo": "carro", "tiempo_reparacion": "1 hora"}'),

-- Restaurante samples
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Pizza Margherita', 'Pizza italiana clásica con mozzarella fresca', 15.99, NULL, 'Platos Principales', 'restaurante', '{"tipo_cocina": "italiana", "tiempo_preparacion": 20, "dificultad": "medio", "calorias": 850}'),
('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Tacos al Pastor', 'Tacos tradicionales con piña y cilantro', 12.50, NULL, 'Platos Principales', 'restaurante', '{"tipo_cocina": "mexicana", "tiempo_preparacion": 15, "alergenos": "ninguno", "calorias": 450}'),

-- Supermercado samples
('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Leche Entera', 'Leche fresca pasteurizada', 3.25, 50, 'Lácteos', 'supermercado', '{"categoria_supermercado": "frescos", "fecha_vencimiento": "2026-02-15", "peso_neto": "1L", "marca": "Lacteos del Valle"}'),
('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Coca-Cola 2L', 'Refresco de cola en botella de 2 litros', 2.50, 30, 'Bebidas', 'supermercado', '{"categoria_supermercado": "bebidas", "peso_neto": "2L", "marca": "Coca-Cola", "codigo_barras": "750100123456"}'),

-- Ferretería samples
('550e8400-e29b-41d4-a716-446655440006'::uuid, 'Taladro Eléctrico', 'Taladro inalámbrico 18V con batería', 89.99, 5, 'Herramientas', 'ferreteria', '{"tipo_ferreteria": "herramienta_electrica", "voltaje": "bateria", "garantia": 24}'),
('550e8400-e29b-41d4-a716-446655440007'::uuid, 'Tubería PVC 2"', 'Tubo de PVC para plomería, diámetro 2 pulgadas', 12.75, 25, 'Plomería', 'ferreteria', '{"tipo_ferreteria": "plomeria", "material": "PVC", "dimensiones": "2m de largo"}'),

-- Gym samples
('550e8400-e29b-41d4-a716-446655440008'::uuid, 'Membresía Premium', 'Acceso completo con clases ilimitadas', 79.99, NULL, 'Membresías', 'gym', '{"tipo_servicio_gym": "membresia_premium", "duracion": "mensual", "sesiones_incluidas": 30}'),
('550e8400-e29b-41d4-a716-446655440009'::uuid, 'Proteína Whey', 'Suplemento de proteína en polvo', 49.99, 12, 'Suplementos', 'gym', '{"tipo_servicio_gym": "suplemento", "marca": "Optimum Nutrition", "peso_neto": "2.27kg"}'),

-- Glamping samples
('550e8400-e29b-41d4-a716-446655440010'::uuid, 'Tienda de Lujo Premium', 'Alojamiento glamping con vistas al lago', 299.00, 3, 'Habitaciones', 'glamping', '{"tipo_alojamiento": "tienda_lujo", "capacidad": 2, "vistas": "lago", "servicios_incluidos": "wifi, desayuno, spa", "temporada_alta": 349.00}'),
('550e8400-e29b-41d4-a716-446655440011'::uuid, 'Paquete Romántico', 'Noche especial con cena incluida', 450.00, 2, 'Paquetes', 'glamping', '{"tipo_alojamiento": "cabaña", "capacidad": 2, "servicios_incluidos": "cena romántica, champagne, desayuno"}'),

-- Discoteca samples
('550e8400-e29b-41d4-a716-446655440012'::uuid, 'Entrada General', 'Acceso general a pista de baile', 25.00, NULL, 'Entradas', 'discoteca', '{"tipo_evento": "noche_regular", "edad_minima": 18, "hora_apertura": "22:00", "hora_cierre": "06:00"}'),
('550e8400-e29b-41d4-a716-446655440013'::uuid, 'Bebida Energética', 'Cóctel energético con vodka', 15.00, NULL, 'Bebidas', 'discoteca', '{"tipo_evento": "noche_regular", "capacidad_maxima": 500, "dj_residente": "DJ Shadow"}');

-- Comments for documentation
COMMENT ON TABLE products IS 'Tabla de productos/servicios con soporte multi-tenant y configuración por industria';
COMMENT ON COLUMN products.tenant_id IS 'ID del tenant (cliente) - usado para aislamiento RLS';
COMMENT ON COLUMN products.industry_type IS 'Tipo de industria que determina el esquema de metadata';
COMMENT ON COLUMN products.metadata IS 'Campos específicos de cada industria almacenados como JSONB';

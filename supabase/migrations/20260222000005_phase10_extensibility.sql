-- =============================================================================
-- Migración 20260222000005: Extensibilidad Dinámica y Sistema de Notificaciones
-- =============================================================================

-- 1. TABLA: notification_templates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Tipo de evento: 'sale.completed', 'service_order.ready', 'product.stock_low'
    event_type VARCHAR(100) NOT NULL,
    
    -- Canal: 'whatsapp', 'email', 'sms'
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    
    -- Cuerpo del mensaje (soporta variables {{variable}})
    template_body TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un template por evento y canal por tenant
    CONSTRAINT notification_templates_unique UNIQUE(tenant_id, event_type, channel)
);

-- RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_templates_select" ON public.notification_templates
    FOR SELECT USING (tenant_id = public.get_current_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "notification_templates_all_admin" ON public.notification_templates
    FOR ALL USING (
        (tenant_id = public.get_current_user_tenant_id() AND public.is_super_admin() = false)
        OR public.is_super_admin()
    );

-- 2. VISTA: v_dashboard_stats
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT 
    t.id AS tenant_id,
    -- Ventas del día
    COALESCE((
        SELECT SUM(total) 
        FROM public.sales 
        WHERE tenant_id = t.id 
          AND created_at >= CURRENT_DATE 
          AND state != 'CANCELADA'
    ), 0) AS daily_sales_total,
    -- Cantidad de ventas del día
    (
        SELECT COUNT(*) 
        FROM public.sales 
        WHERE tenant_id = t.id 
          AND created_at >= CURRENT_DATE 
          AND state != 'CANCELADA'
    ) AS daily_sales_count,
    -- Lead Time Promedio (en minutos) de las últimas 100 transiciones
    COALESCE((
        SELECT AVG(duration_minutes) 
        FROM public.state_history 
        WHERE tenant_id = t.id 
          AND duration_minutes IS NOT NULL
          AND changed_at >= NOW() - INTERVAL '7 days'
    ), 0) AS avg_lead_time_minutes,
    -- Órdenes de servicio activas
    (
        SELECT COUNT(*) 
        FROM public.service_orders 
        WHERE tenant_id = t.id 
          AND state NOT IN ('ENTREGADO', 'CANCELADA')
    ) AS active_service_orders
FROM public.tenants t;

-- 3. ACTUALIZAR: initialize_new_organization
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initialize_new_organization(
    p_name TEXT,
    p_plan TEXT,
    p_industry TEXT,
    p_user_id UUID,
    p_modules TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_customers_limit INTEGER;
    v_inventory_limit INTEGER;
    v_industry_settings JSONB;
BEGIN
    -- Definir esquemas iniciales según industria
    CASE p_industry
        WHEN 'taller' THEN
            v_industry_settings := jsonb_build_object(
                'metadata_schema', jsonb_build_object(
                    'vehicle', jsonb_build_array('placa', 'marca', 'modelo', 'kilometraje'),
                    'sale', jsonb_build_array('tecnico_id', 'vencimiento_garantia')
                ),
                'notification_channels', jsonb_build_array('whatsapp')
            );
        WHEN 'restaurante' THEN
            v_industry_settings := jsonb_build_object(
                'metadata_schema', jsonb_build_object(
                    'product', jsonb_build_array('alergenos', 'tiempo_preparacion'),
                    'sale', jsonb_build_array('mesa', 'mesero', 'num_personas')
                ),
                'notification_channels', jsonb_build_array('whatsapp', 'email')
            );
        ELSE
            v_industry_settings := '{}'::jsonb;
    END CASE;

    -- 1. Insertar el Tenant con settings dinámicos
    INSERT INTO public.tenants (
        name,
        plan,
        industry_type,
        active_modules,
        settings,
        is_active
    ) VALUES (
        p_name,
        p_plan,
        p_industry,
        p_modules,
        v_industry_settings,
        true
    ) RETURNING id INTO v_tenant_id;

    -- 2. Vincular el Perfil del Usuario
    UPDATE public.profiles
    SET 
        tenant_id = v_tenant_id,
        app_role = 'ADMIN',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 3. Sincronizar Metadatos en auth.users
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'tenant_id', v_tenant_id,
            'app_role', 'ADMIN'
        )
    WHERE id = p_user_id;

    -- 4. Definir Límites (Quotas)
    IF p_plan = 'pro' THEN
        v_customers_limit := 100;
        v_inventory_limit := 200;
    ELSIF p_plan = 'enterprise' THEN
        v_customers_limit := 1000;
        v_inventory_limit := 2000;
    ELSE
        v_customers_limit := 10;
        v_inventory_limit := 20;
    END IF;

    -- 5. Insertar Quotas
    INSERT INTO public.tenant_quotas (tenant_id, resource_key, max_limit, current_usage)
    VALUES 
    (v_tenant_id, 'maxCustomers', v_customers_limit, 0),
    (v_tenant_id, 'maxInventoryItems', v_inventory_limit, 0);

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON VIEW public.v_dashboard_stats IS 'Vista consolidada para el Dashboard principal (Sales, Lead Time, Active Orders)';
COMMENT ON TABLE public.notification_templates IS 'Plantillas de mensajes personalizados para integraciones con n8n';

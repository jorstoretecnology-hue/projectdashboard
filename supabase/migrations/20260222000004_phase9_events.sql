-- =============================================================================
-- Migración 20260222000004: Integración de Eventos para n8n
-- =============================================================================

-- 1. FUNCIÓN GENÉRICA: emit_domain_event()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.emit_domain_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.domain_events (
        tenant_id,
        event_type,
        entity_type,
        entity_id,
        payload
    ) VALUES (
        NEW.tenant_id,
        TG_TABLE_NAME || '.' || lower(TG_OP),
        TG_TABLE_NAME,
        NEW.id,
        jsonb_build_object(
            'operation', TG_OP,
            'data', row_to_json(NEW),
            'emitted_at', NOW()
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APLICAR TRIGGERS DE CREACIÓN (n8n Webhook Triggers)
-- -----------------------------------------------------------------------------

-- Ventas (Nuevo Registro)
DROP TRIGGER IF EXISTS trg_emit_sale_created ON public.sales;
CREATE TRIGGER trg_emit_sale_created
    AFTER INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.emit_domain_event();

-- Vehículos (Nuevo Registro)
DROP TRIGGER IF EXISTS trg_emit_vehicle_created ON public.vehicles;
CREATE TRIGGER trg_emit_vehicle_created
    AFTER INSERT ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.emit_domain_event();

-- Órdenes de Servicio (Nuevo Registro)
DROP TRIGGER IF EXISTS trg_emit_service_order_created ON public.service_orders;
CREATE TRIGGER trg_emit_service_order_created
    AFTER INSERT ON public.service_orders
    FOR EACH ROW EXECUTE FUNCTION public.emit_domain_event();

-- 3. MEJORAR EVENTO DE CAMBIO DE ESTADO
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.emit_state_change_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state IS DISTINCT FROM OLD.state THEN
    INSERT INTO domain_events (
      tenant_id,
      event_type,
      entity_type,
      entity_id,
      payload
    ) VALUES (
      NEW.tenant_id,
      TG_TABLE_NAME || '.state_changed',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object(
        'old_state', OLD.state,
        'new_state', NEW.state,
        'entity_data', row_to_json(NEW), -- Payload enriquecido para n8n
        'updated_at', NEW.updated_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON FUNCTION emit_domain_event() IS 'Genera un evento de dominio con el payload completo para integraciones externas (n8n)';

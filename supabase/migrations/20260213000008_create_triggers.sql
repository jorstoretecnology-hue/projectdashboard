-- =============================================================================
-- Migración 08: Funciones y Triggers Críticos
-- Ref: DATABASE_SCHEMA.md Sección 9
-- Crea: update_product_state(), emit_state_change_event(), update_updated_at_column()
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Función: update_updated_at_column()
--    Actualiza updated_at automáticamente en cada UPDATE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas nuevas con updated_at
-- (products y tenants ya pueden tener un trigger similar — son idempotentes gracias a IF NOT EXISTS)

DO $$
BEGIN
  -- sales
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sales_updated_at') THEN
    CREATE TRIGGER trg_sales_updated_at
      BEFORE UPDATE ON sales
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- purchase_orders
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_purchase_orders_updated_at') THEN
    CREATE TRIGGER trg_purchase_orders_updated_at
      BEFORE UPDATE ON purchase_orders
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- services
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_services_updated_at') THEN
    CREATE TRIGGER trg_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- vehicles
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vehicles_updated_at') THEN
    CREATE TRIGGER trg_vehicles_updated_at
      BEFORE UPDATE ON vehicles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- tenant_automations
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenant_automations_updated_at') THEN
    CREATE TRIGGER trg_tenant_automations_updated_at
      BEFORE UPDATE ON tenant_automations
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- automation_templates
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_automation_templates_updated_at') THEN
    CREATE TRIGGER trg_automation_templates_updated_at
      BEFORE UPDATE ON automation_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- products (si no existe)
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at') THEN
    CREATE TRIGGER trg_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Función: update_product_state()
--    Recalcula estado del producto basado en stock y umbrales
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_product_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo recalcular si las columnas relevantes existen y cambiaron
  IF NEW.is_blocked IS TRUE THEN
    NEW.state := 'BLOQUEADO';
  ELSIF NEW.stock = 0 THEN
    NEW.state := 'AGOTADO';
  ELSIF NEW.stock <= COALESCE(NEW.threshold_critical, 3) THEN
    NEW.state := 'CRITICO';
  ELSIF NEW.stock <= COALESCE(NEW.threshold_low, 10) THEN
    NEW.state := 'BAJO_STOCK';
  ELSE
    NEW.state := 'DISPONIBLE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Actualizar estado cuando cambia stock o umbrales
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_product_state') THEN
    CREATE TRIGGER trg_update_product_state
      BEFORE INSERT OR UPDATE OF stock, threshold_low, threshold_critical, is_blocked
      ON products
      FOR EACH ROW
      EXECUTE FUNCTION public.update_product_state();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Función: emit_state_change_event()
--    Emite un domain_event cuando cambia el state de una entidad
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.emit_state_change_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo disparar si el estado realmente cambió
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
        'updated_at', NEW.updated_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de emisión de eventos a todas las tablas con estado
DO $$
BEGIN
  -- products
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_product_state_change') THEN
    CREATE TRIGGER trg_emit_product_state_change
      AFTER UPDATE OF state ON products
      FOR EACH ROW
      EXECUTE FUNCTION public.emit_state_change_event();
  END IF;

  -- sales
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_sale_state_change') THEN
    CREATE TRIGGER trg_emit_sale_state_change
      AFTER UPDATE OF state ON sales
      FOR EACH ROW
      EXECUTE FUNCTION public.emit_state_change_event();
  END IF;

  -- services
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_service_state_change') THEN
    CREATE TRIGGER trg_emit_service_state_change
      AFTER UPDATE OF state ON services
      FOR EACH ROW
      EXECUTE FUNCTION public.emit_state_change_event();
  END IF;

  -- purchase_orders
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_po_state_change') THEN
    CREATE TRIGGER trg_emit_po_state_change
      AFTER UPDATE OF state ON purchase_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.emit_state_change_event();
  END IF;
END $$;

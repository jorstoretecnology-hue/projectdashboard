-- =============================================================================
-- Migración 09: Seed Data — Templates de Automatización
-- Ref: DATABASE_SCHEMA.md Sección 11
-- Inserta los templates base del sistema de automatización
-- =============================================================================

-- Usar UPSERT (ON CONFLICT) para ser idempotente

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Alerta de Stock Crítico (todos los negocios)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO automation_templates (
  template_key, name, description, industry_type,
  trigger_event, trigger_condition,
  message_template, allowed_variables,
  default_channel, priority
) VALUES (
  'STOCK_CRITICAL_ALERT',
  'Alerta de Stock Critico',
  'Notifica cuando un producto alcanza nivel critico de inventario',
  NULL, -- disponible para todas las industrias
  'products.state_changed',
  '{"new_state": "CRITICO"}'::jsonb,
  'Alerta: El producto {{producto_nombre}} (SKU: {{producto_sku}}) tiene stock critico: {{stock_actual}} unidades. Umbral critico: {{umbral_critico}}.',
  '["producto_nombre", "producto_sku", "stock_actual", "umbral_critico", "negocio_nombre"]'::jsonb,
  'whatsapp',
  'HIGH'
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_event = EXCLUDED.trigger_event,
  trigger_condition = EXCLUDED.trigger_condition,
  message_template = EXCLUDED.message_template,
  allowed_variables = EXCLUDED.allowed_variables,
  updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Producto Agotado (todos los negocios)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO automation_templates (
  template_key, name, description, industry_type,
  trigger_event, trigger_condition,
  message_template, allowed_variables,
  default_channel, priority
) VALUES (
  'STOCK_DEPLETED_ALERT',
  'Alerta de Producto Agotado',
  'Notifica cuando un producto se queda sin stock',
  NULL,
  'products.state_changed',
  '{"new_state": "AGOTADO"}'::jsonb,
  'URGENTE: El producto {{producto_nombre}} (SKU: {{producto_sku}}) esta AGOTADO. Se requiere reposicion inmediata.',
  '["producto_nombre", "producto_sku", "negocio_nombre"]'::jsonb,
  'whatsapp',
  'CRITICAL'
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_event = EXCLUDED.trigger_event,
  trigger_condition = EXCLUDED.trigger_condition,
  message_template = EXCLUDED.message_template,
  allowed_variables = EXCLUDED.allowed_variables,
  updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Vehiculo Listo para Retiro (solo taller)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO automation_templates (
  template_key, name, description, industry_type,
  trigger_event, trigger_condition,
  message_template, allowed_variables,
  default_channel, priority
) VALUES (
  'VEHICLE_READY',
  'Vehiculo Listo para Retiro',
  'Notifica al cliente cuando su vehiculo esta reparado y listo para recoger',
  'taller',
  'services.state_changed',
  '{"new_state": "REPARADO"}'::jsonb,
  'Hola {{cliente_nombre}}, tu {{vehiculo_marca}} {{vehiculo_modelo}} ({{vehiculo_placa}}) ya esta listo para ser retirado en {{negocio_nombre}}. Costo final: ${{servicio_costo}}. Horario: Lunes a Sabado, 8am - 6pm.',
  '["cliente_nombre", "vehiculo_marca", "vehiculo_modelo", "vehiculo_placa", "servicio_costo", "negocio_nombre"]'::jsonb,
  'whatsapp',
  'CRITICAL'
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_event = EXCLUDED.trigger_event,
  trigger_condition = EXCLUDED.trigger_condition,
  message_template = EXCLUDED.message_template,
  allowed_variables = EXCLUDED.allowed_variables,
  updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Venta Confirmada (todos los negocios)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO automation_templates (
  template_key, name, description, industry_type,
  trigger_event, trigger_condition,
  message_template, allowed_variables,
  default_channel, priority
) VALUES (
  'SALE_CONFIRMED',
  'Confirmacion de Venta',
  'Envia confirmacion al cliente cuando una venta es confirmada y pagada',
  NULL,
  'sales.state_changed',
  '{"new_state": "PAGADO"}'::jsonb,
  'Hola {{cliente_nombre}}, tu compra #{{venta_numero}} por ${{venta_total}} ha sido confirmada. Gracias por tu preferencia en {{negocio_nombre}}.',
  '["cliente_nombre", "venta_numero", "venta_total", "negocio_nombre"]'::jsonb,
  'whatsapp',
  'NORMAL'
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_event = EXCLUDED.trigger_event,
  trigger_condition = EXCLUDED.trigger_condition,
  message_template = EXCLUDED.message_template,
  allowed_variables = EXCLUDED.allowed_variables,
  updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Servicio Bloqueado (solo taller)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO automation_templates (
  template_key, name, description, industry_type,
  trigger_event, trigger_condition,
  message_template, allowed_variables,
  default_channel, priority
) VALUES (
  'SERVICE_BLOCKED',
  'Servicio Bloqueado - Requiere Atencion',
  'Notifica internamente cuando un servicio se bloquea (falta de repuestos, aprobacion, etc.)',
  'taller',
  'services.state_changed',
  '{"new_state": "BLOQUEADO"}'::jsonb,
  'ATENCION: El servicio del {{vehiculo_marca}} {{vehiculo_modelo}} (placa: {{vehiculo_placa}}) del cliente {{cliente_nombre}} fue BLOQUEADO. Razon: {{bloqueo_razon}}.',
  '["vehiculo_marca", "vehiculo_modelo", "vehiculo_placa", "cliente_nombre", "bloqueo_razon", "negocio_nombre"]'::jsonb,
  'whatsapp',
  'HIGH'
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_event = EXCLUDED.trigger_event,
  trigger_condition = EXCLUDED.trigger_condition,
  message_template = EXCLUDED.message_template,
  allowed_variables = EXCLUDED.allowed_variables,
  updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Orden de Compra Recibida
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO automation_templates (
  template_key, name, description, industry_type,
  trigger_event, trigger_condition,
  message_template, allowed_variables,
  default_channel, priority
) VALUES (
  'PURCHASE_ORDER_RECEIVED',
  'Orden de Compra Recibida',
  'Notifica cuando una orden de compra se marca como recibida completamente',
  NULL,
  'purchase_orders.state_changed',
  '{"new_state": "RECIBIDA_COMPLETA"}'::jsonb,
  'La orden de compra de {{proveedor_nombre}} ha sido recibida completamente. Total: ${{orden_total}}. Por favor verificar el inventario actualizado.',
  '["proveedor_nombre", "orden_total", "negocio_nombre"]'::jsonb,
  'email',
  'NORMAL'
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_event = EXCLUDED.trigger_event,
  trigger_condition = EXCLUDED.trigger_condition,
  message_template = EXCLUDED.message_template,
  allowed_variables = EXCLUDED.allowed_variables,
  updated_at = NOW();

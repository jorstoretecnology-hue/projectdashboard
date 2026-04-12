# 🗄️ Esquema de Base de Datos (DATABASE_SCHEMA.md)

> Esquema completo de Supabase que integra la arquitectura operacional definida en DOMAIN_STATES, BUSINESS_FLOWS y PERMISSIONS_MATRIX.

---

## 📐 1. Principios del Esquema

### Reglas de Oro

1. **Multi-tenancy Estricto**: Toda tabla tiene `tenant_id` (excepto tablas de sistema).
2. **RLS Obligatorio**: Todas las tablas tienen políticas de Row Level Security.
3. **Auditoría Nativa**: Cambios críticos se registran en `audit_logs` y `state_audit_log`.
4. **Estados Explícitos**: Enums de PostgreSQL para garantizar integridad.
5. **Timestamps Automáticos**: `created_at` y `updated_at` en todas las tablas.

---

## 🏗️ 2. Esquema Actual vs Requerido

### ✅ Tablas Existentes (Correctas)

```sql
-- Core del sistema
✅ tenants
✅ profiles (usuarios)
✅ invitations
✅ tenant_quotas
✅ audit_logs

-- Módulos de negocio
✅ customers
✅ products (Catálogo Unificado: Productos y Servicios - **Mantenimiento Maestro**)
✅ inventory_items (LEGACY - Consolidado en `products`, usar solo para refactorización gradual)
```

### ⚠️ Tablas que Necesitan Actualización

#### **products** - Catálogo Unificado (Productos y Servicios)

Se consolida `inventory_items` y se agregan campos fiscales y operativos.

```sql
ALTER TABLE products
ADD COLUMN type VARCHAR(20) DEFAULT 'PRODUCT'
  CHECK (type IN ('PRODUCT', 'SERVICE')),
ADD COLUMN tax_rate NUMERIC(4,2) DEFAULT 0.19,
ADD COLUMN tax_type VARCHAR(20) DEFAULT 'IVA',
ADD COLUMN state VARCHAR(50) DEFAULT 'DISPONIBLE'
  CHECK (state IN ('DISPONIBLE', 'BAJO_STOCK', 'CRÍTICO', 'AGOTADO', 'BLOQUEADO')),
ADD COLUMN threshold_low INTEGER DEFAULT 10,
ADD COLUMN threshold_critical INTEGER DEFAULT 3;
```

#### **profiles** - Sincronizar roles con PERMISSIONS_MATRIX

```sql
-- Actualizar constraint de app_role
ALTER TABLE profiles DROP CONSTRAINT profiles_app_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_app_role_check
  CHECK (app_role IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));
```

#### **tenants** - Agregar configuración operativa

```sql
ALTER TABLE tenants
ADD COLUMN settings JSONB DEFAULT '{
  "employees_can_see_all_sales": false,
  "employees_can_see_prices": true,
  "allow_negative_stock": false,
  "require_override_reason": true
}'::jsonb;
```

### ❌ Tablas Faltantes (Críticas)

---

## 🛒 3. Módulo de Ventas (NUEVO)

### 3.1 Tabla: `sales`

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Relaciones
  customer_id UUID NOT NULL REFERENCES customers(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Estado del flujo (según BUSINESS_FLOWS.md)
  state VARCHAR(50) NOT NULL DEFAULT 'PAGADO'
    CHECK (state IN ('COTIZACIÓN', 'PENDIENTE', 'PAGADO', 'ENTREGADO', 'RECHAZADO', 'CANCELADA')),

  -- Información financiera
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10,2) DEFAULT 0 CHECK (discount >= 0),
  tax NUMERIC(10,2) DEFAULT 0 CHECK (tax >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),

  -- Metadatos del flujo
  payment_method VARCHAR(50),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,

  -- Override (según PERMISSIONS_MATRIX.md)
  is_override BOOLEAN DEFAULT FALSE,
  override_audit_id UUID REFERENCES audit_logs(id),

  -- Notas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_state ON sales(state);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_created_by ON sales(created_by);

-- RLS Policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_tenant_isolation ON sales
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Tabla: `sale_items` (Detalles de venta)

```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- Aislamiento directo
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Snapshot del producto al momento de venta
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0), -- INTEGER COP
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),

  -- Metadatos
  discount INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sale_items_tenant_id ON sale_items(tenant_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- RLS: Aislamiento Directo (Sesión 6)
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY sale_items_tenant_isolation ON sale_items
  FOR ALL USING (tenant_id = get_current_user_tenant_id());
```

---

## 📦 4. Módulo de Compras (NUEVO)

### 4.1 Tabla: `purchase_orders`

```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Proveedor (puede ser texto simple en MVP)
  supplier_name VARCHAR(255) NOT NULL,
  supplier_email VARCHAR(255),
  supplier_phone VARCHAR(50),

  -- Estado del flujo
  state VARCHAR(50) NOT NULL DEFAULT 'BORRADOR'
    CHECK (state IN ('BORRADOR', 'ENVIADA', 'CONFIRMADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_COMPLETA', 'RECHAZADA')),

  -- Información financiera
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),

  -- Metadatos del flujo
  sent_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Usuario que creó
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Notas
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_state ON purchase_orders(state);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at DESC);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_orders_tenant_isolation ON purchase_orders
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);
```

### 4.2 Tabla: `purchase_order_items`

```sql
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Cantidades
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),

  -- Precios
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items(product_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_order_items_via_purchase_orders ON purchase_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND purchase_orders.tenant_id = auth.uid()::text::uuid
    )
  );
```

---

## 🔧 5. Módulo de Servicios (Taller Mecánico)

### 5.1 Tabla: `vehicles` (Para taller)

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Información del vehículo
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER CHECK (year >= 1900 AND year <= 2100),
  plate VARCHAR(50) NOT NULL,
  vin VARCHAR(100),
  color VARCHAR(50),

  -- Metadatos
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT vehicles_tenant_plate_unique UNIQUE(tenant_id, plate)
);

CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicles_tenant_isolation ON vehicles
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);
```

### 5.1 Tabla: `vehicles` (Para taller)

... (Estructura sin cambios) ...

### 5.2 Tabla: `service_orders` (Anteriormente `services`)

Se renombró para evitar colisión con servicios del catálogo.

```sql
ALTER TABLE services RENAME TO service_orders;
```

-- Asignación
assigned_to UUID REFERENCES auth.users(id),
assigned_at TIMESTAMP WITH TIME ZONE,

-- Descripción del servicio
description TEXT NOT NULL,
diagnosis TEXT,

-- Costos
labor_cost NUMERIC(10,2) DEFAULT 0 CHECK (labor_cost >= 0),
parts_cost NUMERIC(10,2) DEFAULT 0 CHECK (parts_cost >= 0),
total_cost NUMERIC(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,

-- Metadatos del flujo
received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
started_at TIMESTAMP WITH TIME ZONE,
blocked_at TIMESTAMP WITH TIME ZONE,
blocked_reason TEXT,
completed_at TIMESTAMP WITH TIME ZONE,
delivered_at TIMESTAMP WITH TIME ZONE,

-- Usuario que creó
created_by UUID NOT NULL REFERENCES auth.users(id),

-- Notas
notes TEXT,

created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_tenant_id ON services(tenant_id);
CREATE INDEX idx_services_state ON services(state);
CREATE INDEX idx_services_customer_id ON services(customer_id);
CREATE INDEX idx_services_vehicle_id ON services(vehicle_id);
CREATE INDEX idx_services_assigned_to ON services(assigned_to);
CREATE INDEX idx_services_created_at ON services(created_at DESC);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY services_tenant_isolation ON services
FOR ALL USING (tenant_id = auth.uid()::text::uuid);

-- Policy especial: Empleados solo ven servicios asignados a ellos
CREATE POLICY services_employee_assigned ON services
FOR SELECT USING (
assigned_to = auth.uid()
OR EXISTS (
SELECT 1 FROM profiles
WHERE profiles.id = auth.uid()
AND profiles.app_role IN ('OWNER', 'ADMIN', 'SUPER_ADMIN')
)
);

````

---

## 📊 6. Movimientos de Inventario (Auditoría de Stock)

### 6.1 Tabla: `inventory_movements`
```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  -- Tipo de movimiento (Flujo físico)
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),

  -- Evento de negocio (Referencia)
  reference_type VARCHAR(50) NOT NULL, -- 'VENTA', 'COMPRA', 'AJUSTE', etc.

  -- Cantidad (positivo = entrada, negativo = salida)
  quantity INTEGER NOT NULL,

  -- Snapshot de stock
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,

  -- Referencia al documento que originó el movimiento
  reference_type VARCHAR(50), -- 'sale', 'purchase_order', 'manual'
  reference_id UUID,

  -- Usuario que realizó el movimiento
  created_by UUID REFERENCES auth.users(id),

  -- Notas
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_movements_tenant_isolation ON inventory_movements
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);
````

---

## 🔔 7. Sistema de Eventos y Automatizaciones

### 7.1 Tabla: `domain_events` (Cola de eventos)

```sql
CREATE TABLE domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tipo de evento
  event_type VARCHAR(100) NOT NULL, -- 'product.state_changed', 'sale.paid', etc.

  -- Entidad que generó el evento
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  -- Payload del evento
  payload JSONB NOT NULL,

  -- Procesamiento
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_failed BOOLEAN DEFAULT FALSE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_domain_events_processed ON domain_events(processed, created_at);
CREATE INDEX idx_domain_events_tenant_id ON domain_events(tenant_id);
CREATE INDEX idx_domain_events_event_type ON domain_events(event_type);

ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY domain_events_tenant_isolation ON domain_events
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);
```

### 7.2 Tabla: `automation_templates` (Catálogo maestro)

```sql
CREATE TABLE automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificador único del template
  template_key VARCHAR(100) NOT NULL UNIQUE,

  -- Metadatos
  name VARCHAR(255) NOT NULL,
  description TEXT,
  industry_type VARCHAR(50), -- NULL = disponible para todas las industrias

  -- Configuración del trigger
  trigger_event VARCHAR(100) NOT NULL, -- 'product.state_changed', 'sale.paid'
  trigger_condition JSONB, -- Condiciones adicionales

  -- Template del mensaje
  message_template TEXT NOT NULL,

  -- Variables permitidas (whitelist)
  allowed_variables JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Canal por defecto
  default_channel VARCHAR(50) DEFAULT 'whatsapp',

  -- Prioridad
  priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),

  -- Sistema
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_automation_templates_trigger_event ON automation_templates(trigger_event);
CREATE INDEX idx_automation_templates_industry_type ON automation_templates(industry_type);
```

### 7.3 Tabla: `tenant_automations` (Configuración por tenant)

```sql
CREATE TABLE tenant_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES automation_templates(id),

  -- Estado
  is_active BOOLEAN DEFAULT TRUE,

  -- Configuración específica del tenant
  config JSONB DEFAULT '{}'::jsonb, -- Ej: { "threshold": 5, "days_before": 2 }

  -- Canal preferido
  channel VARCHAR(50) DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'sms')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT tenant_automations_unique UNIQUE(tenant_id, template_id)
);

CREATE INDEX idx_tenant_automations_tenant_id ON tenant_automations(tenant_id);
CREATE INDEX idx_tenant_automations_is_active ON tenant_automations(is_active);

ALTER TABLE tenant_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_automations_tenant_isolation ON tenant_automations
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);
```

### 7.4 Tabla: `automation_executions` (Log de ejecuciones)

```sql
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES tenant_automations(id),

  -- Contexto de la ejecución
  event_id UUID REFERENCES domain_events(id),

  -- Resultado
  status VARCHAR(50) NOT NULL
    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'ABORTED_MISSING_DATA', 'SKIPPED_DUPLICATE')),

  -- Mensaje enviado
  channel VARCHAR(50),
  recipient VARCHAR(255),
  message_sent TEXT,

  -- Respuesta del proveedor
  external_message_id VARCHAR(255),
  provider_response JSONB,

  -- Reintentos
  retry_count INTEGER DEFAULT 0,

  -- Errores
  error_message TEXT,

  -- Idempotencia
  idempotency_key VARCHAR(255) UNIQUE,

  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_automation_executions_tenant_id ON automation_executions(tenant_id);
CREATE INDEX idx_automation_executions_status ON automation_executions(status);
CREATE INDEX idx_automation_executions_executed_at ON automation_executions(executed_at DESC);

ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY automation_executions_tenant_isolation ON automation_executions
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);
```

---

## 🔐 8. Auditoría de Cambios de Estado

### 8.1 Tabla: `state_history` (Trazabilidad Analítica)

```sql
CREATE TABLE state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  from_state VARCHAR(50),
  to_state VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER, -- Tiempo transcurrido desde el estado anterior
  metadata JSONB DEFAULT '{}'::jsonb
);
```

````

### 8.2 Tabla: `permission_denials` (Intentos de acceso denegado)
```sql
CREATE TABLE permission_denials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Acción intentada
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,

  -- Rol requerido vs actual
  required_role VARCHAR(50) NOT NULL,
  user_role VARCHAR(50) NOT NULL,

  -- Contexto
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

### 8.3 Tabla: `notification_templates` (n8n Ready)
```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL, -- whatsapp, email, sms
  template_body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT notification_templates_unique UNIQUE(tenant_id, event_type, channel)
);
````

### 8.4 Vista: `v_dashboard_stats` (Analytics)

```sql
CREATE VIEW v_dashboard_stats AS
SELECT
    t.id AS tenant_id,
    daily_sales_total,
    daily_sales_count,
    avg_lead_time_minutes,
    active_service_orders
FROM tenants t; -- Agregado via subqueries analíticos
```

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

````

---

## ⚙️ 9. Funciones y Triggers Críticos

### 9.1 Trigger: Recalcular estado de producto
```sql
-- Función para actualizar el estado del producto automáticamente
CREATE OR REPLACE FUNCTION update_product_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular estado basado en stock y umbrales
  IF NEW.is_blocked THEN
    NEW.state := 'BLOQUEADO';
  ELSIF NEW.stock = 0 THEN
    NEW.state := 'AGOTADO';
  ELSIF NEW.stock <= NEW.threshold_critical THEN
    NEW.state := 'CRÍTICO';
  ELSIF NEW.stock <= NEW.threshold_low THEN
    NEW.state := 'BAJO_STOCK';
  ELSE
    NEW.state := 'DISPONIBLE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger ANTES de insertar o actualizar
CREATE TRIGGER trigger_update_product_state
  BEFORE INSERT OR UPDATE OF stock, threshold_low, threshold_critical, is_blocked
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_state();
````

### 9.2 Trigger: Emitir evento cuando cambia el estado

```sql
CREATE OR REPLACE FUNCTION emit_state_change_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo disparar si el estado cambió
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
        'entity_data', row_to_json(NEW)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con estados
CREATE TRIGGER emit_product_state_change
  AFTER UPDATE OF state ON products
  FOR EACH ROW
  EXECUTE FUNCTION emit_state_change_event();

CREATE TRIGGER emit_sale_state_change
  AFTER UPDATE OF state ON sales
  FOR EACH ROW
  EXECUTE FUNCTION emit_state_change_event();

CREATE TRIGGER emit_service_state_change
  AFTER UPDATE OF state ON services
  FOR EACH ROW
  EXECUTE FUNCTION emit_state_change_event();
```

### 9.3 Función: Actualizar timestamp automáticamente

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 9.4 Motor de Ventas: Cálculos y Transaccionalidad (Sesión 6)

#### Función: `fn_calculate_sale_totals()`

Calcula automáticamente subtotal, impuestos y total de una venta basándose en sus ítems. Corregido para operar sobre la tabla `sales` y usar `INTEGER COP`.

```sql
CREATE OR REPLACE FUNCTION fn_calculate_sale_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal INTEGER;
    v_tax_rate INTEGER;
    v_tax_amount INTEGER;
BEGIN
    SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
    FROM sale_items WHERE sale_id = NEW.sale_id;

    SELECT tax_rate INTO v_tax_rate FROM sales WHERE id = NEW.sale_id;
    v_tax_amount := ROUND(v_subtotal * v_tax_rate / 100);

    UPDATE sales SET
        subtotal = v_subtotal,
        tax = v_tax_amount,
        total = v_subtotal + v_tax_amount,
        updated_at = NOW()
    WHERE id = NEW.sale_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### RPC: `create_sale_transaction()`

Crea una venta y sus ítems de forma atómica.
**Parámetros:**

- `p_tenant_id`: UUID (Obligatorio)
- `p_customer_id`: UUID
- `p_items`: JSONB[] (Incluye product_id, quantity, unit_price, subtotal)
- `p_tax_rate`: INTEGER (Ej: 19)
- `p_discount`: INTEGER (COP)

---

## 🔧 10. Checklist de Migración

### Fase 1: Actualizar Tablas Existentes

- [ ] Agregar campos de estado a `products`
- [ ] Actualizar constraint de roles en `profiles`
- [ ] Agregar `settings` JSONB a `tenants`
- [ ] Deprecar `inventory_items` (fusionar con `products` si es necesario)

### Fase 2: Crear Tablas de Ventas

- [ ] Crear `sales`
- [ ] Crear `sale_items`
- [ ] Crear índices y RLS policies

### Fase 3: Crear Tablas de Compras

- [ ] Crear `purchase_orders`
- [ ] Crear `purchase_order_items`
- [ ] Crear índices y RLS policies

### Fase 4: Crear Tablas de Servicios (Taller)

- [ ] Crear `vehicles`
- [ ] Crear `services`
- [ ] Crear índices y RLS policies especiales para empleados

### Fase 5: Sistema de Inventario

- [ ] Crear `inventory_movements`
- [ ] Crear índices y RLS policies

### Fase 6: Sistema de Eventos

- [ ] Crear `domain_events`
- [ ] Crear `automation_templates`
- [ ] Crear `tenant_automations`
- [ ] Crear `automation_executions`
- [ ] Poblar templates iniciales

### Fase 7: Auditoría y Seguridad

- [ ] Crear `state_audit_log`
- [ ] Crear `permission_denials`
- [ ] Actualizar `audit_logs` existente si es necesario

### Fase 8: Funciones y Triggers

- [ ] Crear función `update_product_state()`
- [ ] Crear función `emit_state_change_event()`
- [ ] Crear función `update_updated_at_column()`
- [ ] Aplicar triggers a todas las tablas

---

## 🎯 11. Scripts de Seed Data

### 11.1 Seed: Templates de Automatización

```sql
-- Template: Alerta de Stock Crítico
INSERT INTO automation_templates (
  template_key,
  name,
  description,
  trigger_event,
  trigger_condition,
  message_template,
  allowed_variables,
  default_channel,
  priority
) VALUES (
  'STOCK_CRITICAL_ALERT',
  'Alerta de Stock Crítico',
  'Notifica cuando un producto alcanza nivel crítico',
  'product.state_changed',
  '{"new_state": "CRÍTICO"}',
  'Alerta: El producto {{producto_nombre}} (SKU: {{producto_sku}}) tiene stock crítico: {{stock_actual}} unidades.',
  '["producto_nombre", "producto_sku", "stock_actual", "negocio_nombre"]',
  'whatsapp',
  'HIGH'
);

-- Template: Vehículo Reparado (LA MÁS IMPORTANTE PARA TALLER)
INSERT INTO automation_templates (
  template_key,
  name,
  description,
  industry_type,
  trigger_event,
  trigger_condition,
  message_template,
  allowed_variables,
  default_channel,
  priority
) VALUES (
  'VEHICLE_READY',
  'Vehículo Listo para Retiro',
  'Notifica al cliente cuando su vehículo está reparado',
  'taller',
  'service.state_changed',
  '{"new_state": "REPARADO"}',
  'Hola {{cliente_nombre}}, tu {{vehiculo_marca}} {{vehiculo_modelo}} ({{vehiculo_placa}}) ya está listo para ser retirado en {{negocio_nombre}}. Costo final: ${{servicio_costo}}. Horario: Lunes a Sábado, 8am - 6pm.',
  '["cliente_nombre", "vehiculo_marca", "vehiculo_modelo", "vehiculo_placa", "servicio_costo", "negocio_nombre"]',
  'whatsapp',
  'CRITICAL'
);

-- Más templates...
```

---

## 📚 Referencias

### Documentos Relacionados

- [DOMAIN_STATES.md](./DOMAIN_STATES.md) - Estados que se implementan aquí
- [BUSINESS_FLOWS.md](./BUSINESS_FLOWS.md) - Flujos que requieren estas tablas
- [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) - RLS policies basadas en roles

### Scripts SQL Completos

Ejecutar en orden:

1. `01_update_existing_tables.sql`
2. `02_create_sales_module.sql`
3. `03_create_purchases_module.sql`
4. `04_create_services_module.sql`
5. `05_create_inventory_movements.sql`
6. `06_create_automation_system.sql`
7. `07_create_audit_tables.sql`
8. `08_create_triggers.sql`
9. `09_seed_automation_templates.sql`
10. `20260305000001_implement_soft_deletes.sql` ← Borrado Lógico
11. `20260305000002_webhook_system.sql` ← Webhooks + pg_net
12. `20260305000003_cron_purge_and_rls_test.sql` ← Purga automática + Test RLS

---

## 🔔 10. Módulo de Webhooks y Automatización

> Sistema de despacho de eventos asíncronos para integrar con plataformas externas (n8n, Zapier, etc.).

### 10.1 Tabla: `webhook_subscriptions`

```sql
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,         -- URL de destino
  event_type VARCHAR(255) NOT NULL,   -- Ej: 'customers.insert'
  secret VARCHAR(255),                -- Clave para firma HMAC-SHA256
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_subs_tenant_event ON webhook_subscriptions(tenant_id, event_type);
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_subs_isolation ON webhook_subscriptions
  FOR ALL USING (tenant_id = get_current_user_tenant_id());
```

### 10.2 Tabla: `webhook_logs`

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  request_id BIGINT,                  -- ID de pg_net
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING | SUCCESS | FAILED
  response_status_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_logs_isolation ON webhook_logs
  FOR ALL USING (tenant_id = get_current_user_tenant_id());
```

### 10.3 Función: `dispatch_webhook()` (SECURITY DEFINER)

- **Firma HMAC**: Si la suscripción tiene un `secret`, el payload se firma con HMAC-SHA256 y se envía en el header `x-webhook-signature: sha256=<hex>`.
- **Detección de Soft Delete**: Un `UPDATE` donde `deleted_at` pasa de `NULL` a un valor se emite como evento `.delete`.
- **Tolerancia a Fallos**: El envío via `net.http_post` está envuelto en un bloque `EXCEPTION`. Si falla, el log se marca como `FAILED` con el mensaje de error.

### 10.4 Eventos Soportados

| Tabla             | Evento      | Nombre                   |
| ----------------- | ----------- | ------------------------ |
| `customers`       | INSERT      | `customers.insert`       |
| `customers`       | UPDATE      | `customers.update`       |
| `customers`       | Soft Delete | `customers.delete`       |
| `inventory_items` | INSERT      | `inventory_items.insert` |
| `inventory_items` | UPDATE      | `inventory_items.update` |
| `inventory_items` | Soft Delete | `inventory_items.delete` |

### 10.5 Payload Estándar

```json
{
  "event": "customers.insert",
  "timestamp": "2026-03-05T19:00:00Z",
  "tenant_id": "uuid",
  "data": { "id": "uuid", "name": "Acme", ... },
  "old_data": { ... } // Solo en UPDATE
}
```

---

## 🗑️ 11. Sistema de Borrado Lógico (Soft Deletes)

> Columna `deleted_at TIMESTAMPTZ DEFAULT NULL` en tablas principales. Un trigger `handle_soft_delete()` intercepta `DELETE` y lo convierte en `UPDATE SET deleted_at = NOW()`.

### Tablas con Soft Delete

`customers`, `inventory_items`, `products`, `profiles`, `sales`, `sale_items`, `purchase_orders`, `purchase_order_items`, `vehicles`, `services`

### RLS Refactorizado

Todas las políticas incluyen `AND deleted_at IS NULL` para ocultar registros eliminados.

### Restauración

Función RPC `restore_record(p_table_name, p_record_id)` (SECURITY DEFINER) que setea `deleted_at = NULL`.

---

**Estado**: ✅ **Esquema Completo Definido**  
**Versión**: 1.1.0  
**Última Actualización**: 2026-03-05  
**Compatibilidad**: Supabase PostgreSQL 15+  
**Mantenedor**: Smart Business OS Core Team

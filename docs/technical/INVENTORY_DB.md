# 📋 Inventario Técnico de Base de Datos
> **Fuente:** Consultas SQL directas al proyecto `kpdadwtxfazhtoqnttdh`
> **Fecha:** 2026-04-01
> **Estado:** ✅ VERIFICADO — Generado desde `information_schema` y `pg_catalog`, NO desde dump SQL.

---

## 🏢 Tablas Multi-Tenant (tienen `tenant_id` → protegidas por RLS)

| Tabla | Columnas Clave | Soft Delete |
|-------|---------------|-------------|
| `audit_logs` | id, tenant_id, user_id, action, entity_type, entity_id, old_data (jsonb), new_data (jsonb), ip_address, created_at | ❌ |
| `automation_logs` | id, tenant_id, automation_rule_id, domain_event_id, status, error_message, provider_response (jsonb), executed_at | ❌ |
| `automation_rules` | id, tenant_id, name, event_type, condition_json, action_type, action_config (jsonb), is_active | ❌ |
| `customers` | id, tenant_id, name, first_name, last_name, email (NOT NULL), phone, metadata (jsonb), location_id, identification_type, identification_number, city, company_name, tax_id, status | ✅ deleted_at |
| `domain_events` | id, tenant_id, event_type, entity_type, entity_id, payload (jsonb), created_at | ❌ |

### 1.1 Catálogo Unificado (`products`)
La tabla `products` ahora consolida lo que anteriormente era `inventory_items`. Todos los productos y servicios se gestionan desde este catálogo para simplificar la lógica de ventas y compras.

- **Herencia**: Los campos de stock, SKU y tipo ahora residen en `products`.
- **Legacy**: La tabla `inventory_items` se mantiene temporalmente para compatibilidad con módulos antiguos pero será deprecada en la v6.0.

| `inventory_movements` | id, tenant_id, product_id → products, quantity, type (IN, OUT, ADJUSTMENT), reference_type (VENTA, etc.), created_at | ❌ |
| `invitations` | id, email, tenant_id, app_role, invited_by, token (uuid), status, expires_at | ❌ |
| `locations` | id, tenant_id, name, address, city, country, phone, timezone, opening_hours (jsonb), settings (jsonb), is_main, is_active | ✅ deleted_at |
| `notification_templates` | id, tenant_id, event_type, channel, template_body, is_active | ❌ |
| `payments` | id, tenant_id, subscription_id, amount, currency, status, provider, provider_payment_id, failure_reason, paid_at, refunded_at, metadata (jsonb), mercadopago_payment_id | ❌ |
| `products` | id, tenant_id, name, description, price, stock, category, sku, image, industry_type, metadata (jsonb), state, threshold_low, threshold_critical, is_blocked, type, tax_rate, tax_type, location_id | ✅ deleted_at |
| `purchase_orders` | id, tenant_id, supplier_id, state, total, location_id | ✅ deleted_at |
| `sale_items` | id, sale_id → sales, product_id → products, quantity, unit_price, subtotal, product_name, product_sku | ✅ deleted_at |
| `sales` | id, tenant_id, customer_id → customers, state, total, discount, metadata (jsonb), created_by, subtotal, tax, payment_method, notes, location_id, tracking_token (NOT NULL) | ✅ deleted_at |
| `service_orders` | id, tenant_id, name, base_price, state, location_id | ❌ |
| `state_history` | id, tenant_id, entity_type, entity_id, from_state, to_state, changed_by, changed_at, duration_minutes, metadata (jsonb) | ❌ |
| `subscriptions` | id, tenant_id, plan_slug, status, billing_cycle, current_period_start, current_period_end, trial_ends_at, cancelled_at, provider, provider_sub_id | ❌ |
| `suppliers` | id, tenant_id, name, email, phone, created_at | ❌ |
| `tenant_modules` | id, tenant_id, module_slug, is_active, config (jsonb), activated_at, expires_at | ❌ |
| `tenant_quotas` | tenant_id (PK), resource_key (PK), current_usage, max_limit, updated_at | ❌ |
| `tenant_tags` | id, tenant_id, tag, created_at | ❌ |
| `vehicles` | id, tenant_id, customer_id → customers, plate, brand, model, location_id | ✅ deleted_at |
| `webhook_logs` | id, subscription_id, tenant_id, event_type, payload (jsonb), request_id, status, response_status_code, source, error_message | ❌ |
| `webhook_subscriptions` | id, tenant_id, url, event_type, secret, is_active | ❌ |

**Total: 25 tablas multi-tenant**

---

## 🌍 Tablas Globales (sin `tenant_id`)

| Tabla | Propósito | Notas |
|-------|-----------|-------|
| `industries` | Catálogo de industrias (taller, restaurante, etc.) | Lectura pública (RLS permissive) |
| `industry_pricing` | Precios por industria + plan | Lectura pública |
| `industry_specialties` | Sub-especialidades por industria | Lectura pública |
| `modules_catalog` | Catálogo de módulos disponibles | Lectura pública |
| `plan_modules` | Qué módulos incluye cada plan | Lectura pública |
| `plans` | Planes de suscripción (free, starter, pro) | Lectura pública |
| `profiles` | Perfil de usuario (linked a auth.users) | RLS por usuario y rol |
| `security_groups` | Grupos de seguridad RBAC | Lectura pública |
| `tenants` | Registro principal de cada tenant/empresa | RLS: owner ve el suyo, SUPER_ADMIN ve todos |
| `tracking_access_log` | Log de accesos a tracking público | RLS: deny_all (solo server-side) |
| `tracking_failed_attempts` | Intentos fallidos de tracking | RLS: deny_all |
| `user_groups` | Asignación usuario ↔ grupo | RLS por usuario |
| `user_locations` | Asignación usuario ↔ sede (location) | RLS por admin |

**Total: 13 tablas globales**

---

## 👁️ Vistas (NO modificar, solo lectura)

| Vista | Propósito |
|-------|-----------|
| `v_dashboard_stats` | Estadísticas agregadas para el dashboard principal |
| `view_saas_health` | Métricas de salud del sistema SaaS (para superadmin) |

---

## 🔑 Relaciones Principales (Foreign Keys relevantes)

```
sales.customer_id          → customers.id
sales.location_id          → locations.id
sale_items.sale_id         → sales.id
sale_items.product_id      → products.id
inventory_movements.product_id → products.id
vehicles.customer_id       → customers.id
purchase_orders.supplier_id → suppliers.id
payments.subscription_id   → subscriptions.id
subscriptions.plan_slug    → plans.slug
tenant_modules.tenant_id   → tenants.id
profiles.tenant_id         → tenants.id
user_locations.user_id     → profiles.id
user_locations.location_id → locations.id
```

---

## ⚡ Índices Destacados (47 en total)

| Índice | Tabla | Propósito |
|--------|-------|-----------|
| `idx_sales_tenant_created_at` | sales | Listados paginados por fecha |
| `idx_sales_tenant_state` | sales | Filtros por estado |
| `idx_sales_tracking_token` | sales | Lookup de tracking público |
| `idx_products_tenant_deleted` | products | Soft delete queries |
| `idx_products_tenant_sku` | products | Búsqueda por SKU |
| `idx_customers_tenant_email` | customers | Búsqueda por email |
| `idx_customers_tenant_deleted` | customers | Soft delete queries |
| `idx_payments_tenant` | payments | Historial de pagos por tenant |
| `idx_subscriptions_tenant` | subscriptions | Estado de suscripción |
| `idx_inventory_movements_tenant_product` | inventory_movements | Movimientos por producto |

---

## 🛡️ Políticas RLS (80 políticas — por tabla)

### customers (4)
- `customers_select_tenant_active` — SELECT
- `customers_insert_tenant_active` — INSERT
- `customers_update_tenant_active` — UPDATE
- `customers_delete_tenant_active` — DELETE

### products (4)
- `products_select_tenant_active`, `products_insert_tenant_active`, `products_update_tenant_active`, `products_delete_tenant_active`

### sales (4)
- `sales_select_tenant_active`, `sales_insert_tenant_active`, `sales_update_tenant_active`, `sales_delete_tenant_active`

### sale_items (4)
- `sale_items_select_via_sales`, `sale_items_insert_via_sales`, `sale_items_update_via_sales`, `sale_items_delete_via_sales`

### payments (4)
- `payments_select_tenant`, `payments_insert_tenant`, `payments_update_tenant`, `payments_delete_tenant`

### inventory_movements (1)
- `inventory_movements_tenant_isolation`

### vehicles (4)
- `vehicles_select_tenant_active`, `vehicles_insert_tenant_active`, `vehicles_update_tenant_active`, `vehicles_delete_tenant_active`

### profiles (múltiples)
- `Profile Own Access`, `Users can view own profile`, `Usuarios ven su propio perfil`, `Usuarios editan su propio perfil`
- `Admins can view tenant profiles`, `SuperAdmins can view all profiles`
- `Superadmins pueden crear/editar/eliminar perfiles`

### tenants
- `Tenants Isolation`, `Tenants Isolation Policy`, `Tenants Update Settings Policy`
- `tenants_super_admin_full_access`, `tenants_tenant_own_record`

### invitations (3)
- `invitations_tenant_isolation`, `invitations_public_token_check`, `invitations_allow_tenant_preview`

### Públicas (solo lectura)
- `plans_public_read`, `modules_catalog_read`, `industry_pricing_public_read`, `specialties_public_read`
- `Catálogo de industrias es de lectura pública`

### Tracking (protegidas)
- `tracking_access_deny_all`, `tracking_failed_deny_all`

### Otras
- `subscriptions_tenant_isolation`, `locations_tenant_isolation`, `suppliers_isolation`
- `webhook_logs_isolation`, `webhook_subs_isolation`, `domain_events_tenant_isolation`
- `tenant_modules_isolation`, `tags_tenant_isolation`, `state_history_select`
- `auto_rules_all`, `auto_logs_all`, `notification_templates_select`

---

## 🤖 Triggers (por tabla)

### `customers` (8 triggers)
| Trigger | Evento | Función |
|---------|--------|---------|
| `tr_check_customer_quota` | BEFORE INSERT | `validate_quota_on_insert()` |
| `tr_customers_metadata_protect` | BEFORE UPDATE | `prevent_metadata_change()` |
| `tr_protect_metadata` | BEFORE UPDATE | `protect_row_metadata()` |
| `set_updated_at` | BEFORE UPDATE | `update_updated_at_column()` |
| `tr_customers_webhook` | AFTER INSERT/UPDATE | `dispatch_webhook()` |
| `tr_soft_delete_customers` | BEFORE DELETE | `handle_soft_delete()` |
| `tr_sync_customer_usage` | AFTER INSERT/DELETE | `sync_quota_usage()` |

### `products` (8 triggers)
| Trigger | Evento | Función |
|---------|--------|---------|
| `tr_check_inventory_quota` | BEFORE INSERT | `validate_quota_on_insert()` |
| `tr_products_location_validate` | BEFORE INSERT/UPDATE | `validate_location_tenant()` |
| `tr_products_metadata_protect` | BEFORE UPDATE | `prevent_metadata_change()` |
| `tr_protect_metadata` | BEFORE UPDATE | `protect_row_metadata()` |
| `set_updated_at` | BEFORE UPDATE | `update_updated_at_column()` |
| `tr_products_webhook` | AFTER INSERT/UPDATE | `dispatch_webhook()` |
| `tr_soft_delete_products` | BEFORE DELETE | `handle_soft_delete()` |
| `tr_sync_inventory_usage` | AFTER INSERT/DELETE | `sync_quota_usage()` |

### `sales` (9 triggers)
| Trigger | Evento | Función |
|---------|--------|---------|
| `tr_sales_location_validate` | BEFORE INSERT/UPDATE | `validate_location_tenant()` |
| `tr_sales_metadata_protect` | BEFORE UPDATE | `prevent_metadata_change()` |
| `tr_protect_metadata` | BEFORE UPDATE | `protect_row_metadata()` |
| `trg_sync_sale_total_on_discount` | BEFORE UPDATE | `fn_sync_sale_total_on_discount()` |
| `set_updated_at` | BEFORE UPDATE | `update_updated_at_column()` |
| `tr_soft_delete_sales` | BEFORE DELETE | `handle_soft_delete()` |
| `trg_emit_sale_created` | AFTER INSERT | `emit_domain_event()` |
| `trg_sales_state_history` | AFTER INSERT/UPDATE | `track_state_history()` |

### `sale_items` (2 triggers)
- `trg_calculate_sale_totals` — AFTER INSERT/UPDATE/DELETE → `fn_calculate_sale_totals()`
- `tr_soft_delete_sale_items` — BEFORE DELETE → `handle_soft_delete()`

### `subscriptions` (3 triggers)
- `tr_subscriptions_audit_sa` — AFTER INSERT/UPDATE/DELETE → `audit_superadmin_action()`
- `trigger_activate_modules` — AFTER INSERT/UPDATE → `handle_module_activation_on_subscription()`
- `set_updated_at`

### `tenants` (3 triggers)
- `tr_tenants_audit_sa` — AFTER INSERT/UPDATE/DELETE → `audit_superadmin_action()`
- `trigger_activate_modules` — AFTER INSERT → `activate_tenant_modules_on_signup()`
- `update_tenants_updated_at`

### Otras tablas con triggers
- `profiles` — audit_sa, soft_delete, metadata_protect, protect_profile_metadata, set_updated_at
- `vehicles` — soft_delete, metadata_protect, emit_domain_event, set_updated_at
- `purchase_orders` — soft_delete, metadata_protect, protect_row_metadata
- `service_orders` — emit_domain_event, state_history, metadata_protect
- `suppliers`, `locations`, `payments`, `invitations`, `webhook_subscriptions` — set_updated_at / metadata_protect

---

## 🛠️ Funciones (RPC / Helpers) — 50 funciones totales

### 🔐 Helpers de Contexto (usados en RLS)
| Función | Retorna | SECURITY DEFINER |
|---------|---------|-----------------|
| `get_current_user_tenant_id()` | `uuid` | ✅ |
| `get_current_user_app_role()` | `text` | ✅ |
| `is_super_admin()` | `boolean` | ✅ |
| `is_super_admin(user_id uuid)` | `boolean` | ✅ |
| `is_superadmin()` | `boolean` | ✅ |
| `is_tenant_manager()` | `boolean` | ✅ |
| `get_user_location_ids()` | `uuid[]` | ✅ |
| `get_user_authorized_locations()` | `TABLE(loc_id uuid)` | ✅ |
| `get_sibling_location_ids(p_location_id)` | `uuid[]` | ✅ |

### 💼 Transacciones de Negocio
| Función | Retorna | SECURITY DEFINER |
|---------|---------|-----------------|
| `create_sale_transaction(...)` | `jsonb` | ✅ (v2 con metadata) |
| `cancel_sale_transaction(p_sale_id, p_user_id)` | `jsonb` | ✅ |
| `create_purchase_transaction(...)` | `jsonb` | ✅ |
| `receive_purchase_transaction(...)` | `jsonb` | ✅ |
| `complete_service_transaction(...)` | `jsonb` | ❌ |
| `initialize_new_organization(...)` | `uuid` | ✅ (2 overloads) |
| `create_location(...)` | `uuid` | ✅ |
| `restore_record(target_table, record_id, tenant_id)` | `void` | ✅ |

### 🏷️ Módulos y Quotas
| Función | Retorna | SECURITY DEFINER |
|---------|---------|-----------------|
| `activate_modules_for_tenant(p_tenant_id, p_plan_slug)` | `jsonb` | ✅ |
| `increment_tenant_quota(p_tenant_id, p_resource_key, p_amount)` | `void` | ✅ |
| `decrement_tenant_quota(p_tenant_id, p_resource_key, p_amount)` | `void` | ✅ |
| `get_tenant_price(p_tenant_id, p_plan_slug, p_billing_cycle)` | `numeric` | ✅ |
| `purge_old_logs()` | `void` | ✅ |

### 🔒 Seguridad y Tracking
| Función | Retorna | SECURITY DEFINER |
|---------|---------|-----------------|
| `get_safe_tracking_data(p_token, p_ip)` | `jsonb` | ✅ |
| `get_sale_id_by_token(p_token)` | `uuid` | ✅ |
| `check_tracking_rate_limit(p_ip)` | `boolean` | ✅ |
| `register_public_delivery(...)` | `jsonb` | ✅ |
| `generate_sale_hmac(p_sale_id, p_tenant_id)` | `text` | ❌ |

### 🤖 Funciones-Trigger (retornan `trigger`)
| Función | Propósito |
|---------|-----------|
| `activate_tenant_modules_on_signup()` | Asigna módulos al crear tenant |
| `audit_superadmin_action()` | Audita cambios de SUPER_ADMIN |
| `dispatch_webhook()` | Dispara webhooks a subscriptores |
| `emit_domain_event()` | Emite eventos de dominio al bus |
| `emit_state_change_event()` | Emite evento cuando cambia estado |
| `fn_calculate_sale_totals()` | Recalcula totales de ventas |
| `fn_sync_sale_total_on_discount()` | Sincroniza total cuando hay descuento |
| `handle_jwt_claims()` | Inyecta claims en el JWT de Supabase Auth |
| `handle_module_activation_on_subscription()` | Activa módulos al cambiar plan |
| `handle_new_user()` | Crea perfil en `profiles` al registrarse |
| `handle_soft_delete()` | Convierte DELETE en soft delete |
| `handle_updated_at()` | Actualiza `updated_at` automáticamente |
| `notify_webhook_event()` | Notifica via pg_notify |
| `prevent_metadata_change()` | Bloquea cambios a campos inmutables |
| `protect_profile_metadata()` | Bloquea tenant_id e id en profiles |
| `protect_row_metadata()` | Bloquea tenant_id e id en todas las tablas |
| `sync_quota_usage()` | Sincroniza contadores de cuota |
| `track_state_history()` | Registra cambios de estado en state_history |
| `update_service_totals()` | Actualiza totales de órdenes de servicio |
| `update_updated_at_column()` | Alias de handle_updated_at |
| `validate_location_tenant()` | Valida que location pertenezca al tenant |
| `validate_quota_on_insert()` | Bloquea INSERT si se excedió la cuota |

---

## 📦 Motor Atómico de Ventas (Implementación Validada)

Se ha implementado una arquitectura transaccional de ventas con control de inventario robusto basada en `PL/pgSQL`.

### Flujo de `create_sale_transaction`:
1. **Atómica**: Una sola transacción SQL mediante `SECURITY DEFINER`.
2. **Bloqueo de Stock**: Usa `FOR UPDATE` sobre los productos involucrados para prevenir race conditions.
3. **Validación**: Verifica existencia y stock suficiente antes de proceder.
4. **Registro Dual**: 
   - Actualiza `products.stock`.
   - Registra en `inventory_movements` con `type='OUT'` y `reference_type='VENTA'`.
5. **Consistencia**: Calcula totales e impuestos (subtotal, tax, total) de forma persistente.

### Tipos de Movimiento (Kardex):
| Tipo | Flujo Físico | Evento de Negocio |
|------|--------------|-------------------|
| `IN` | Entrada (+) | Compra, Devolución |
| `OUT` | Salida (-) | Venta, Pérdida |
| `ADJUSTMENT` | +/- | Ajuste Manual, Inventario Físico |

---

## 📊 Resumen de Salud del Sistema (Actualizado)
| Componente | Cantidad | Estado |
|-----------|---------|--------|
| Tablas Multi-Tenant | 25 | ✅ |
| Tablas Globales | 13 | ✅ |
| Vistas | 2 | ✅ |
| Funciones totales | 50 | ✅ |
| Motor de Ventas | 1 | ✅ Atómico & Seguro |
| Políticas RLS | 80 | ✅ |

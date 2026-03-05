-- -----------------------------------------------------------------------------
-- Hardening: Row Level Security & Audit Logs
-- -----------------------------------------------------------------------------

-- 1. Tabla de Logs de Auditoría
create table if not exists audit_logs (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid not null,
    user_id uuid, -- ID del usuario que realizó la acción
    action text not null, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'PLAN_CHANGE', 'MODULE_TOGGLE'
    entity_type text not null, -- 'INVENTORY', 'CUSTOMER', 'TENANT', 'AUTH'
    entity_id uuid, -- ID del registro afectado
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz default now()
);

-- Índices para búsqueda rápida
create index if not exists idx_audit_tenant on audit_logs(tenant_id);
create index if not exists idx_audit_action on audit_logs(action);
create index if not exists idx_audit_entity on audit_logs(entity_type, entity_id);

-- 2. Habilitar RLS en Audit Logs
alter table audit_logs enable row level security;

-- Solo el tenant puede ver sus logs
create policy "Audit Logs Select Policy"
on audit_logs for select
using (
    tenant_id = get_current_user_tenant_id()
);

-- Solo el sistema puede insertar (a través de funciones o service role)
-- Bloqueamos inserción manual desde el cliente por seguridad
create policy "Audit Logs System Insert"
on audit_logs for insert
with check (false); 

-- -----------------------------------------------------------------------------
-- 3. Hardening: Completar Políticas RLS en Módulos Existentes
-- -----------------------------------------------------------------------------

-- Aseguramos que las tablas existan (Bootstrap temprano para evitar error 42P01)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- INVENTORY (Update & Delete)
create policy "Inventory Update Policy"
on inventory_items for update
using (tenant_id = get_current_user_tenant_id())
with check (tenant_id = get_current_user_tenant_id());

create policy "Inventory Delete Policy"
on inventory_items for delete
using (tenant_id = get_current_user_tenant_id());

-- CUSTOMERS (Update & Delete)
create policy "Customers Update Policy"
on customers for update
using (tenant_id = get_current_user_tenant_id())
with check (tenant_id = get_current_user_tenant_id());

create policy "Customers Delete Policy"
on customers for delete
using (tenant_id = get_current_user_tenant_id());

-- -----------------------------------------------------------------------------
-- 4. Protección de Datos Críticos (Tenants Table)
-- -----------------------------------------------------------------------------

-- Asegurar que un tenant no pueda ver datos de otros tenants en la tabla central
-- (Si ya existe, la reforzamos)
alter table tenants enable row level security;

create policy "Tenants Isolation Policy"
on tenants for select
using (id = get_current_user_tenant_id());

-- El SuperAdmin (rol admin) puede ver todo (Ejemplo de bypass via role)
-- drop policy if exists "SuperAdmin View All" on tenants;
-- create policy "SuperAdmin View All"
-- on tenants for select
-- using ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' );

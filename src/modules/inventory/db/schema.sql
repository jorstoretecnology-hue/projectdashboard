-- -----------------------------------------------------------------------------
-- Módulo: Inventory
-- Tabla: inventory_items
-- Descripción: Almacena productos y servicios por tenant.
-- -----------------------------------------------------------------------------

create table if not exists inventory_items (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null, -- Obligatorio para Multi-tenancy
  
  -- Campos de Negocio (Contract: inventoryItemSchema)
  name text not null,
  description text,
  type text not null check (type in ('product', 'service', 'room', 'membership')),
  price numeric(10, 2) not null default 0,
  stock integer not null default 0,
  sku text,
  image text,
  
  -- Metadatos de Auditoría
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_inventory_tenant on inventory_items(tenant_id);
create index if not exists idx_inventory_sku on inventory_items(sku) where sku is not null;

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS) - GOVERNANCE
-- -----------------------------------------------------------------------------

-- 1. Habilitar RLS
alter table inventory_items enable row level security;

-- 2. Políticas de Seguridad (Blueprint)
-- Nota: Asumimos que existe una forma de validar el tenant_id del usuario actual
-- ya sea via JWT claims (auth.jwt() -> 'app_metadata' -> 'tenant_id')
-- o via tabla de relación members.

-- Policy: Select (Ver solo mis items)
create policy "Inventory Select Policy"
on inventory_items for select
using (
    tenant_id = get_current_user_tenant_id()
);

-- Policy: Insert (Crear solo en mi tenant)
create policy "Inventory Insert Policy"
on inventory_items for insert
with check (
    tenant_id = get_current_user_tenant_id()
);

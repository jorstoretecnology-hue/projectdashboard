-- -----------------------------------------------------------------------------
-- Módulo: Customers
-- Tabla: customers
-- Descripción: Gestión de clientes por tenant.
-- -----------------------------------------------------------------------------

create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null, -- Isolation
  
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index if not exists idx_customers_tenant on customers(tenant_id);
create index if not exists idx_customers_email on customers(email, tenant_id);

-- RLS
alter table customers enable row level security;

-- Select Policy
create policy "Customers Isolation Policy (Select)"
on customers for select
using (
    tenant_id = get_current_user_tenant_id()
);

-- Insert Policy
create policy "Customers Isolation Policy (Insert)"
on customers for insert
with check (
    tenant_id = get_current_user_tenant_id()
);

-- -----------------------------------------------------------------------------
-- Core: Tenant Quotas
-- Tabla: tenant_quotas
-- Descripción: Almacena el consumo actual de recursos por tenant
-- -----------------------------------------------------------------------------

create table if not exists tenant_quotas (
  tenant_id uuid not null,
  resource_key text not null, -- 'maxUsers', 'maxInventoryItems', 'maxCustomers'
  current_usage integer not null default 0,
  updated_at timestamptz default now(),
  
  primary key (tenant_id, resource_key)
);

-- Indices
create index if not exists idx_quotas_tenant on tenant_quotas(tenant_id);

-- RLS
alter table tenant_quotas enable row level security;

-- Policy: Select (Tenant puede ver su consumo)
create policy "Quota View Policy"
on tenant_quotas for select
using (
    tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
);

-- Policy: Update (Solo sistema vía RPC o funciones seguras)
-- En arquitectura real, esto se maneja con Service Role.
-- Para desarrollo, permitimos uso interno si el backend lo requiere,
-- pero idealmente debe ser security definer functions.

-- -----------------------------------------------------------------------------
-- FASE 1 - CIERRE DE FOUNDATION
-- -----------------------------------------------------------------------------

-- 1. Asegurar que la tabla Profiles tenga los campos necesarios para el Dashboard
alter table public.profiles add column if not exists last_login timestamptz;

-- 2. Refuerzo de Auditoría: Eventos de Quota Exceeded
-- Agregamos un trigger o funcion para facilitar el logueo de cuotas
comment on table public.audit_logs is 'Registro central de eventos para cumplimiento y dashboard ejecutivo';

-- 3. Vista de Auditoría para SuperAdmin (Facilita las queries del Dashboard)
create or replace view public.view_saas_health as
select 
    t.name as tenant_name,
    t.plan,
    count(a.id) filter (where a.action = 'QUOTA_EXCEEDED') as quota_alerts,
    max(a.created_at) as last_activity
from public.tenants t
left join public.audit_logs a on t.id = a.tenant_id
group by t.id, t.name, t.plan;

-- 4. Permisos Finales para el rol autenticado
grant usage on schema public to authenticated;
grant all on public.profiles to authenticated;
grant all on public.inventory_items to authenticated;
grant all on public.customers to authenticated;
grant all on public.audit_logs to authenticated;
grant select on public.tenants to authenticated;

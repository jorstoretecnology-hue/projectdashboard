-- 1. Agregar Feature Flags a la tabla de Tenants
alter table tenants add column if not exists feature_flags text[] default '{}';

-- Comentario para documentación
comment on column tenants.feature_flags is 'Lista de features habilitadas para el tenant (crm, inventory, billing, etc)';

-- 2. Función para inyectar permisos en el JWT (Custom Claims)
-- Esto optimiza la ejecución al no requerir consultas a DB en cada validación 'can()'
create or replace function public.handle_jwt_claims()
returns trigger as $$
declare
  user_role text;
  user_permissions text[];
  user_tenant_id uuid;
  tenant_features text[];
begin
  -- Obtener rol y tenant_id del perfil
  select role, tenant_id into user_role, user_tenant_id
  from public.profiles
  where id = new.id;

  -- Obtener features del tenant
  if user_tenant_id is not null then
    select feature_flags into tenant_features
    from public.tenants
    where id = user_tenant_id;
  end if;

  -- Mapear permisos según el rol (Sincronizado con src/config/permissions.ts)
  case user_role
    when 'superadmin' then
      user_permissions := array['customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'inventory.view', 'inventory.manage', 'billing.view', 'billing.manage', 'users.manage', 'settings.edit', 'admin.console'];
    when 'admin' then
      user_permissions := array['customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'inventory.view', 'inventory.manage', 'users.manage', 'settings.edit'];
    else
      user_permissions := array['customers.view', 'inventory.view'];
  end case;

  -- Inyectar en app_metadata del JWT
  new.raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role,
      'tenant_id', user_tenant_id,
      'permissions', user_permissions,
      'features', coalesce(tenant_features, '{}'::text[])
    );

  return new;
end;
$$ language plpgsql security privilege;

-- Borrar trigger si existe para evitar duplicados
drop trigger if exists on_auth_user_created_update_jwt on auth.users;

-- Ejecutar en cada creación de usuario
create trigger on_auth_user_created_update_jwt
  before insert or update on auth.users
  for each row execute function public.handle_jwt_claims();

-- 3. Actualizar tenants existentes con features básicas
update tenants set feature_flags = array['crm', 'inventory'] where feature_flags = '{}';
update tenants set feature_flags = array['crm', 'inventory', 'billing'] where plan = 'pro' or plan = 'enterprise';

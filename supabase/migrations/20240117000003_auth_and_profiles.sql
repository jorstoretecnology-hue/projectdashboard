-- -----------------------------------------------------------------------------
-- Profiles and Auth Sync
-- -----------------------------------------------------------------------------

-- 1. Tabla de Perfiles de Usuario
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text,
    avatar_url text,
    tenant_id uuid references public.tenants(id),
    role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Habilitar RLS en Profiles
alter table public.profiles enable row level security;

-- Política: Los usuarios pueden ver su propio perfil
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

-- Política: SuperAdmin puede ver todos los perfiles
create policy "SuperAdmins can view all profiles"
on public.profiles for select
using ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' );

-- Política: Tenant Admins pueden ver perfiles de su tenant
create policy "Admins can view tenant profiles"
on public.profiles for select
using ( 
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid 
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'superadmin')
);

-- 3. Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, role, tenant_id)
    values (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name',
        coalesce(new.app_metadata->>'role', 'user'),
        (new.app_metadata->>'tenant_id')::uuid
    );
    return new;
end;
$$ language plpgsql security definer;

-- Borrar si ya existe para evitar errores en re-runs
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. Refuerzo de RLS en tenants
-- -----------------------------------------------------------------------------
-- Asegurar que el usuario solo vea su tenant (ya lo hicimos, pero lo confirmamos)
drop policy if exists "Tenants Isolation Policy" on public.tenants;
create policy "Tenants Isolation Policy"
on public.tenants for select
using (
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
);

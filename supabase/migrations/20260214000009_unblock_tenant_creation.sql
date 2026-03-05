-- =============================================================================
-- Migración: Reparación Maestra de RLS e IsSuperAdmin
-- Descripción: Corrige el error de columna inexistente "app_metadata" en profiles
-- y establece políticas de inserción definitivas para la tabla tenants.
-- =============================================================================

-- 1. Reparar is_super_admin de forma robusta
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.is_super_admin();
    DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  u_role text;
BEGIN
  -- 1.1 Intentar desde el JWT (Estandarizado a Mayúsculas)
  u_role := UPPER(auth.jwt() -> 'app_metadata' ->> 'app_role');
  IF u_role = 'SUPER_ADMIN' THEN RETURN TRUE; END IF;
  
  -- 1.1 b Fallback para JWTs viejos que usen solo 'role'
  u_role := UPPER(auth.jwt() -> 'app_metadata' ->> 'role');
  IF u_role = 'SUPER_ADMIN' THEN RETURN TRUE; END IF;

  -- 1.2 Fallback definitivo a la tabla profiles
  SELECT UPPER(app_role) INTO u_role FROM public.profiles WHERE id = user_id;
  RETURN u_role = 'SUPER_ADMIN';
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Limpieza de políticas en la tabla tenants
DROP POLICY IF EXISTS tenants_super_admin_full_access ON tenants;
DROP POLICY IF EXISTS tenants_tenant_own_record ON tenants;
DROP POLICY IF EXISTS "SuperAdmin puede ver todos los tenants" ON tenants;
DROP POLICY IF EXISTS "SuperAdmin puede crear tenants" ON tenants;
DROP POLICY IF EXISTS "SuperAdmin puede editar tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants ven su propio perfil" ON tenants;

-- 3. Aplicar políticas granulares (Más seguras para INSERT)
-- SELECT: SuperAdmin ve TODO, Tenants ven solo lo suyo
CREATE POLICY "tenants_select_rule" ON tenants
    FOR SELECT
    USING (is_super_admin() OR id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- INSERT: Solo SuperAdmin puede crear nuevas instancias
CREATE POLICY "tenants_insert_rule" ON tenants
    FOR INSERT
    WITH CHECK (is_super_admin());

-- UPDATE: SuperAdmin puede editar todo
CREATE POLICY "tenants_update_rule" ON tenants
    FOR UPDATE
    USING (is_super_admin());

-- DELETE: Solo SuperAdmin
CREATE POLICY "tenants_delete_rule" ON tenants
    FOR DELETE
    USING (is_super_admin());

-- 4. Asegurar permisos de Postgres para el rol legacy "user" y "authenticated"
GRANT ALL ON TABLE tenants TO authenticated;
GRANT ALL ON TABLE tenants TO service_role;
GRANT ALL ON TABLE tenants TO "user";

-- Comentario para auditoría
COMMENT ON FUNCTION is_super_admin IS 'Verifica rol SUPER_ADMIN de forma robusta sin fallar por columnas inexistentes.';

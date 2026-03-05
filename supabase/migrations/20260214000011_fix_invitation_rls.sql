-- =============================================================================
-- Migración: Corregir Políticas RLS para Invitaciones (SuperAdmin Fix)
-- Descripción: Permite que el SuperAdmin gestione invitaciones de cualquier
-- tenant sin que la política de aislamiento lo bloquee.
-- =============================================================================

-- 1. Eliminar políticas antiguas restrictivas
DROP POLICY IF EXISTS "Admins can manage their tenant invitations" ON public.invitations;
DROP POLICY IF EXISTS "SuperAdmins can view all invitations" ON public.invitations;

-- 2. Política Universal para SuperAdmin (Control Total)
CREATE POLICY "SuperAdmin gestiona todas las invitaciones" ON public.invitations
    FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- 3. Política para Admins de Tenant (Aislamiento)
-- Usamos UPPER para evitar problemas de case-sensitivity
CREATE POLICY "Admins gestionan sus propias invitaciones" ON public.invitations
    FOR ALL
    USING (
        tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
        AND UPPER(auth.jwt() -> 'app_metadata' ->> 'app_role') = 'ADMIN'
    )
    WITH CHECK (
        tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
        AND UPPER(auth.jwt() -> 'app_metadata' ->> 'app_role') = 'ADMIN'
    );

-- 4. Asegurar que las invitaciones se puedan leer por token (para el registro)
DROP POLICY IF EXISTS "Allow public select by token" ON public.invitations;
CREATE POLICY "Lectura pública por token pendiente" ON public.invitations
    FOR SELECT
    USING (status = 'pending' AND expires_at > now());

-- 5. Otorgar permisos a roles de Postgres
GRANT ALL ON TABLE public.invitations TO authenticated;
GRANT ALL ON TABLE public.invitations TO service_role;
GRANT ALL ON TABLE public.invitations TO "user";

COMMENT ON TABLE public.invitations IS 'Políticas RLS corregidas para permitir gestión global por SUPER_ADMIN.';

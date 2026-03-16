-- Task #4: Implement missing RLS on user_locations
-- UPDATE: solo OWNER/ADMIN pueden modificar roles
DROP POLICY IF EXISTS "user_locations_admin_update" ON public.user_locations;
CREATE POLICY "user_locations_admin_update"
ON public.user_locations FOR UPDATE
USING (
  location_id IN (
    SELECT ul.location_id FROM public.user_locations ul
    WHERE ul.user_id = auth.uid()
      AND ul.role IN ('OWNER', 'ADMIN')
      AND ul.is_active = true
  )
)
WITH CHECK (role IN ('OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));

-- DELETE: solo OWNER puede revocar accesos
DROP POLICY IF EXISTS "user_locations_owner_delete" ON public.user_locations;
CREATE POLICY "user_locations_owner_delete"
ON public.user_locations FOR DELETE
USING (
  location_id IN (
    SELECT ul.location_id FROM public.user_locations ul
    WHERE ul.user_id = auth.uid()
      AND ul.role = 'OWNER'
      AND ul.is_active = true
  )
);

-- Task #5: get_current_user_tenant_id() con fallback
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Primero intentar desde el JWT (rápido)
  v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
  
  -- Fallback: consultar profiles si el JWT no tiene tenant_id
  IF v_tenant_id IS NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN v_tenant_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

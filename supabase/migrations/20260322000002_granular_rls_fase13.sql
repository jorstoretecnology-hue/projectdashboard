-- Fase 13: RLS Granular por Sede y Roles
-- Objetivo: Restringir acceso a sedes específicas para roles EMPLOYEE/VIEWER

-- 1. Helper Function: Obtener el rol de la app_metadata
CREATE OR REPLACE FUNCTION public.get_current_user_app_role()
RETURNS text AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::text;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Helper Function: Verificar si es OWNER o ADMIN del Tenant
CREATE OR REPLACE FUNCTION public.is_tenant_manager()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role' IN ('OWNER', 'ADMIN', 'superadmin'));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Helper Function: Obtener sedes autorizadas para el usuario
CREATE OR REPLACE FUNCTION public.get_user_authorized_locations()
RETURNS TABLE (loc_id uuid) AS $$
BEGIN
  RETURN QUERY 
  SELECT location_id 
  FROM public.user_locations 
  WHERE user_id = auth.uid() 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Limpieza de políticas redundantes (Ejemplo para inventory_items)
DROP POLICY IF EXISTS "Inventory Isolation" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_isolation_all" ON inventory_items;

-- 5. Nueva Política Unificada para inventory_items
CREATE POLICY "inventory_items_granular_isolation" ON public.inventory_items
  FOR ALL
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      is_tenant_manager() -- Los dueños ven todo logísticamente
      OR 
      location_id IN (SELECT loc_id FROM get_user_authorized_locations()) -- Los empleados solo sus sedes
    )
    AND deleted_at IS NULL
  );

-- 6. Aplicar lo mismo a customers
DROP POLICY IF EXISTS "Customers Isolation" ON customers;
DROP POLICY IF EXISTS "customers_isolation_all" ON customers;

CREATE POLICY "customers_granular_isolation" ON public.customers
  FOR ALL
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      is_tenant_manager()
      OR 
      location_id IN (SELECT loc_id FROM get_user_authorized_locations())
      OR
      location_id IS NULL -- Registros globales del tenant
    )
    AND deleted_at IS NULL
  );

-- 7. Aplicar a sales
DROP POLICY IF EXISTS "sales_iso" ON sales;
DROP POLICY IF EXISTS "sales_isolation" ON sales;
DROP POLICY IF EXISTS "sales_tenant_isolation" ON sales;

CREATE POLICY "sales_granular_isolation" ON public.sales
  FOR ALL
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      is_tenant_manager()
      OR 
      location_id IN (SELECT loc_id FROM get_user_authorized_locations())
    )
    AND deleted_at IS NULL
  );

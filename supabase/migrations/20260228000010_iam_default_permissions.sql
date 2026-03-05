-- =============================================================================
-- MIGRACIÓN: PERMISOS POR DEFECTO IAM
-- =============================================================================
-- Esta migración actualiza el trigger de claims para inyectar permisos 
-- granulares en el JWT basados en el rol del usuario.

CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
  u_permissions text[];
BEGIN
  -- 1. Obtener rol y tenant desde profiles
  SELECT 
    COALESCE(app_role, role, 'VIEWER'), 
    tenant_id 
  INTO u_role, u_tenant 
  FROM public.profiles 
  WHERE id = new.id;
  
  -- 2. Mapeo de Permisos Granulares
  CASE u_role
    WHEN 'SUPER_ADMIN' THEN
      u_permissions := ARRAY[
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
        'inventory.view', 'inventory.manage',
        'billing.view', 'billing.manage',
        'users.manage',
        'settings.edit',
        'admin.console'
      ];
    WHEN 'ADMIN' THEN
      u_permissions := ARRAY[
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
        'inventory.view', 'inventory.manage',
        'users.manage',
        'settings.edit'
      ];
    WHEN 'USER' THEN
      u_permissions := ARRAY[
        'customers.view',
        'inventory.view'
      ];
    ELSE
      u_permissions := ARRAY['inventory.view'];
  END CASE;

  -- 3. Inyectar en app_metadata del JWT
  new.raw_app_meta_data = COALESCE(new.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'VIEWER'),
      'tenant_id', u_tenant,
      'permissions', u_permissions
    );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de documentación
COMMENT ON FUNCTION public.handle_jwt_claims() IS 'Genera claims de JWT con mapeo dinámico de permisos por rol.';

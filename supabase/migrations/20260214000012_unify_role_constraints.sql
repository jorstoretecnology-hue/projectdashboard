-- =============================================================================
-- MIGRACIÓN: ESTANDARIZACIÓN TOTAL DE ROLES (UPPERCASE)
-- Descripción: Limpia y unifica todas las restricciones de roles en la base
-- de datos para usar el estándar profesional en MAYÚSCULAS.
-- =============================================================================

-- 1. LIMPIEZA DE TABLA PROFILES
-- -----------------------------------------------------------------------------
-- Eliminamos cualquier restricción previa
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_app_role_check;

-- Convertimos datos existentes a mayúsculas para evitar errores
UPDATE public.profiles SET app_role = UPPER(app_role);

-- Agregamos la restricción definitiva
ALTER TABLE public.profiles ADD CONSTRAINT profiles_app_role_check 
CHECK (app_role IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));


-- 2. LIMPIEZA DE TABLA INVITATIONS
-- -----------------------------------------------------------------------------
-- Eliminamos cualquier restricción previa (incluyendo las creadas por Postgres automáticamente)
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_app_role_check;
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_role_check;

-- Convertimos datos existentes
UPDATE public.invitations SET app_role = UPPER(app_role);

-- Agregamos la restricción definitiva
ALTER TABLE public.invitations ADD CONSTRAINT invitations_app_role_check 
CHECK (app_role IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));


-- 3. ACTUALIZACIÓN DE CLAIMS JWT
-- -----------------------------------------------------------------------------
-- Aseguramos que la función que genera tokens también use mayúsculas
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  SELECT UPPER(app_role), tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  new.raw_app_meta_data = (COALESCE(new.raw_app_meta_data, '{}'::jsonb) - 'role') || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'USER'),
      'tenant_id', u_tenant
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de éxito
COMMENT ON TABLE profiles IS 'Roles estandarizados a UPPERCASE: SUPER_ADMIN, OWNER, ADMIN, EMPLOYEE, VIEWER.';

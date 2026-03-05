-- =============================================================================
-- SUPER-PARCHE DE REPARACIÓN TOTAL IAM (RESILIENTE)
-- =============================================================================

-- 1. SANEAMIENTO DE COLUMNAS EN PROFILES
-- Aseguramos que la columna 'app_role' exista y sea la principal.
DO $$ 
BEGIN 
    -- Si existe 'role' pero no 'app_role', renombramos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'app_role') THEN
        ALTER TABLE public.profiles RENAME COLUMN role TO app_role;
    END IF;

    -- Si no existe ninguna, la creamos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'app_role') THEN
        ALTER TABLE public.profiles ADD COLUMN app_role TEXT;
    END IF;
END $$;

-- 2. LIMPIEZA DE RESTRICCIONES OBSOLETAS
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_app_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_app_role_check1;

-- 3. REPARACIÓN DEL GUARDIA DE PERMISOS (JWT CLAIMS) - BEFORE INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  -- Consultamos el perfil (intentando ambos nombres de columna por si acaso)
  SELECT app_role, tenant_id INTO u_role, u_tenant FROM public.profiles WHERE id = new.id;
  
  -- Sincronizamos metadatos PRIORIZANDO lo que viene en la creación (new.raw_app_meta_data)
  -- si es que el perfil aún no existe.
  new.raw_app_meta_data = COALESCE(new.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, new.raw_app_meta_data->>'app_role', new.raw_app_meta_data->>'role', 'VIEWER'),
      'tenant_id', u_tenant
    );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REPARACIÓN DEL GUARDIA DE PERFILES (NUEVOS USUARIOS) - AFTER INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_clean_role TEXT;
BEGIN
    -- Capturar el rol desde app_metadata (varias llaves posibles por redundancia)
    v_clean_role := UPPER(COALESCE(
        new.raw_app_meta_data->>'app_role', 
        new.raw_app_meta_data->>'role', 
        'VIEWER'
    ));

    -- Normalizar rol admisible
    IF v_clean_role NOT IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER') THEN
        v_clean_role := 'VIEWER';
    END IF;

    -- Inserción/Upsert en profiles
    INSERT INTO public.profiles (id, full_name, app_role)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        v_clean_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        app_role = EXCLUDED.app_role,
        updated_at = NOW();

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RE-INSTALACIÓN DE DISPARADORES
DROP TRIGGER IF EXISTS on_auth_user_created_update_jwt ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created_update_jwt
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_jwt_claims();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMENTARIO DE ÉXITO
COMMENT ON TABLE public.profiles IS 'IAM Saneado v2: Soporta app_role con redundancia y normalización automática.';

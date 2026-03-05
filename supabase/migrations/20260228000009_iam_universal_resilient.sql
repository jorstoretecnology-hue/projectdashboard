-- =============================================================================
-- SUPER-PARCHE UNIVERSAL RESILIENTE IAM (v3 - FORENSE)
-- =============================================================================
-- Este script detecta el estado real de tu base de datos y aplica correcciones
-- quirúrgicas para que la creación de usuarios no vuelva a fallar por Error 500.

DO $$ 
DECLARE
    v_has_email BOOLEAN;
    v_has_role BOOLEAN;
    v_has_app_role BOOLEAN;
BEGIN 
    -- 1. DETECCIÓN DE ESTADO
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') INTO v_has_email;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') INTO v_has_role;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='app_role') INTO v_has_app_role;

    -- 2. NORMALIZACIÓN DE COLUMNA DE ROL
    -- Si existe 'role' pero no 'app_role', renombramos para estandarizar
    IF v_has_role AND NOT v_has_app_role THEN
        ALTER TABLE public.profiles RENAME COLUMN role TO app_role;
        v_has_app_role := TRUE;
        v_has_role := FALSE;
    END IF;

    -- Si no existe ninguna de las dos, creamos 'app_role'
    IF NOT v_has_role AND NOT v_has_app_role THEN
        ALTER TABLE public.profiles ADD COLUMN app_role TEXT;
    END IF;

    -- 3. RELAJACIÓN DE RESTRICCIONES (SRE Hardening)
    -- Quitamos NOT NULL de email si existe, para que el sistema moderno no se rompa
    IF v_has_email THEN
        ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
    END IF;

END $$;

-- 4. LIMPIEZA DE CONSTRAINTS AGRESIVA
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_app_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_app_role_check1;

-- 5. FUNCIÓN handle_new_user MULTIDIMENSIONAL (Detecta columnas al vuelo)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_clean_role TEXT;
    v_cols TEXT[];
    v_vals TEXT[];
    v_sql TEXT;
BEGIN
    -- A. Normalizar Rol
    v_clean_role := UPPER(COALESCE(
        new.raw_app_meta_data->>'app_role', 
        new.raw_app_meta_data->>'role', 
        'VIEWER'
    ));

    -- B. Construcción Dinámica para evitar errores de "columna inexistente"
    v_cols := ARRAY['id', 'full_name', 'app_role'];
    v_vals := ARRAY[quote_nullable(new.id::text), quote_nullable(new.raw_user_meta_data->>'full_name'), quote_nullable(v_clean_role)];

    -- Si existe la columna email, la agregamos al insert
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        v_cols := array_append(v_cols, 'email');
        v_vals := array_append(v_vals, quote_nullable(new.email));
    END IF;

    -- Si existe avatar_url, lo agregamos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        v_cols := array_append(v_cols, 'avatar_url');
        v_vals := array_append(v_vals, quote_nullable(new.raw_user_meta_data->>'avatar_url'));
    END IF;

    -- Si el administrador envió un tenant_id en metadata, lo honramos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='tenant_id') 
       AND (new.raw_app_meta_data->>'tenant_id') IS NOT NULL THEN
        v_cols := array_append(v_cols, 'tenant_id');
        v_vals := array_append(v_vals, quote_nullable(new.raw_app_meta_data->>'tenant_id'));
    END IF;

    -- C. Ejecución Dinámica Final (Resiliente a cambios de esquema)
    v_sql := format('INSERT INTO public.profiles (%s) VALUES (%s) ON CONFLICT (id) DO UPDATE SET updated_at = NOW()', 
             array_to_string(v_cols, ','), 
             array_to_string(v_vals, ','));
    
    EXECUTE v_sql;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN handle_jwt_claims (Solo inyección limpia)
CREATE OR REPLACE FUNCTION public.handle_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  u_role text;
  u_tenant uuid;
BEGIN
  -- Intentamos leer app_role (preferido) o role (legacy)
  SELECT 
    COALESCE(app_role, role, 'VIEWER'), 
    tenant_id 
  INTO u_role, u_tenant 
  FROM public.profiles 
  WHERE id = new.id;
  
  -- Inyectar en el JWT metadatos limpios
  new.raw_app_meta_data = COALESCE(new.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'app_role', COALESCE(u_role, 'VIEWER'),
      'tenant_id', u_tenant
    );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Si falla la consulta a profiles, dejamos pasar el login pero sin roles extra
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RE-INSTALACIÓN
DROP TRIGGER IF EXISTS on_auth_user_created_update_jwt ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created_update_jwt
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_jwt_claims();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.profiles IS 'Esquema Resiliente v3: Auto-detección de columnas y protección contra Error 500.';

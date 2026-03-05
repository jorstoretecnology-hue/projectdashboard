-- 1. Crear funcion para verificar si un usuario es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_groups ug
        JOIN security_groups sg ON ug.group_id = sg.id
        WHERE ug.user_id = auth.uid()
        AND sg.name = 'group_system'
    ) INTO is_admin;
    
    RETURN COALESCE(is_admin, false);
END;
$$;

-- 2. Asegurar politicas sobre perfiles (profiles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpiar politicas previas para evitar conflictos (PostgreSQL < 15)
DROP POLICY IF EXISTS "Superadmins pueden ver todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins pueden crear perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins pueden editar perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins pueden eliminar perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON public.profiles;

-- Politicas para el SuperAdmin (Tu cuenta)
CREATE POLICY "Superadmins pueden ver todos los perfiles"
ON public.profiles FOR SELECT USING ( public.is_superadmin() );

CREATE POLICY "Superadmins pueden crear perfiles"
ON public.profiles FOR INSERT WITH CHECK ( public.is_superadmin() );

CREATE POLICY "Superadmins pueden editar perfiles"
ON public.profiles FOR UPDATE USING ( public.is_superadmin() ) WITH CHECK ( public.is_superadmin() );

CREATE POLICY "Superadmins pueden eliminar perfiles"
ON public.profiles FOR DELETE USING ( public.is_superadmin() );

-- Politicas para el resto de los usuarios normales
CREATE POLICY "Usuarios ven su propio perfil"
ON public.profiles FOR SELECT USING ( auth.uid() = id );

CREATE POLICY "Usuarios editan su propio perfil"
ON public.profiles FOR UPDATE USING ( auth.uid() = id ) WITH CHECK ( auth.uid() = id );

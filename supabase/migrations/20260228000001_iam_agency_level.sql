-- Migración: Fase 13 - IAM Nivel Agencia (DBA Agent)
-- Crea la estructura base para control de acceso granular y promueve al primer usuario.

-- 1. Tabla de Grupos de Seguridad (Roles/Perfiles del sistema)
CREATE TABLE IF NOT EXISTS public.security_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en security_groups (solo lectura pública por ahora, gestión por superadmin después)
ALTER TABLE public.security_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica de security_groups" ON public.security_groups FOR SELECT USING (true);

-- 2. Tabla de Asignación de Usuarios a Grupos
CREATE TABLE IF NOT EXISTS public.user_groups (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.security_groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);

-- Habilitar RLS en user_groups
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
-- Por defecto, un usuario puede ver solo sus propios grupos. Superadmin verá todos (política posterior).
CREATE POLICY "Usuarios ven sus propios grupos" ON public.user_groups FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Insertar el grupo base del sistema (Superadmin)
INSERT INTO public.security_groups (name, description) 
VALUES ('group_system', 'Superadministradores globales de la plataforma')
ON CONFLICT (name) DO NOTHING;

-- 4. Promover al usuario actual (johnjortiz018@gmail.com) al grupo group_system
DO $$
DECLARE
    v_user_id UUID;
    v_group_id UUID;
BEGIN
    -- Obtener ID del usuario
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'johnjortiz018@gmail.com' LIMIT 1;
    
    -- Obtener ID del grupo recién creado
    SELECT id INTO v_group_id FROM public.security_groups WHERE name = 'group_system' LIMIT 1;

    -- Si ambos existen, asignarlo
    IF v_user_id IS NOT NULL AND v_group_id IS NOT NULL THEN
        INSERT INTO public.user_groups (user_id, group_id) 
        VALUES (v_user_id, v_group_id)
        ON CONFLICT (user_id, group_id) DO NOTHING;
        
        -- Tambien sincronizar la columna app_role en profiles por retrocompatibilidad
        UPDATE public.profiles SET app_role = 'SUPER_ADMIN' WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuario johnjortiz018@gmail.com promovido a SUPER_ADMIN en group_system exitosamente.';
    ELSE
        RAISE WARNING 'No se pudo promover al usuario (ID no encontrado o grupo no creado). Asegurese de que el usuario ya este registrado en auth.users.';
    END IF;
END $$;

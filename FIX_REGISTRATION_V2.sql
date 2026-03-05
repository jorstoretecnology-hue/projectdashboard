-- 🚨 VERSION SEGURA (V2) 🚨
-- Si el script anterior falló con "must be owner of relation users", usa este.
-- Este script NO intenta borrar el trigger del sistema, solo arregla la lógica interna.

-- 1. CORREGIR LA TABLA (Permitir registrarse sin tenant)
-- Esto es fundamental para que el primer paso del registro no falle.
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. CORREGIR LA LÓGICA DE LA FUNCIÓN (Sin tocar el trigger)
-- Al actualizar la función, el trigger existente (que ya apunta a ella) empezará a funcionar bien.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Buena práctica de seguridad
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, app_role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'), 
    new.raw_user_meta_data->>'avatar_url', 
    'user' -- Rol default
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Evitamos romper el registro si esto falla
  RAISE WARNING 'Error no bloqueante en handle_new_user: %', SQLERRM;
  RETURN new; 
END;
$$;

-- 3. NOTA:
-- No intentamos DROP/CREATE trigger en auth.users porque parece que ya existe y está protegido.
-- Con los pasos 1 y 2 es suficiente.

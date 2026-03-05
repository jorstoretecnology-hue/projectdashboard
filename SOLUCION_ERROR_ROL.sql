/*
  INSTRUCCIONES PARA EL USUARIO:
  1. Ve a tu proyecto en Supabase (https://supabase.com/dashboard).
  2. Entra a la sección "SQL Editor" (icono de terminal en la barra lateral izquierda).
  3. Crea una "New Query".
  4. Copia y pega TODO el código de abajo en el editor.
  5. Dale al botón "Run" (ejecutar).
  6. Una vez que diga "Success", vuelve a tu aplicación (localhost:3000), RECARGA la página (F5) e intenta crear tu empresa de nuevo.
*/

BEGIN;

-- 1. Limpiar la metadata de TODOS los usuarios para eliminar el rol corrupto 'user'
-- Esto soluciona el error "role user does not exist"
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data - 'role'
WHERE raw_app_meta_data ? 'role';

-- 2. Asegurar que todos tengan el 'app_role' nuevo (evita conflictos futuros)
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{app_role}', '"user"')
WHERE NOT(raw_app_meta_data ? 'app_role');

-- 3. Eliminar el rol de base de datos 'user' si existe (es el que causa el error)
DROP ROLE IF EXISTS "user";

COMMIT;

-- 4. Verificación (debería salir vacía o con datos corregidos)
SELECT id, email, raw_app_meta_data FROM auth.users;

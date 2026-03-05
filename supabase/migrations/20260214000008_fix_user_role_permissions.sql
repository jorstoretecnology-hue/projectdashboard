-- =============================================================================
-- Migración: Corregir Permisos del Rol "user" (Band-Aid de Emergencia)
-- Descripción: Permite que el rol authenticator de Supabase pueda "asumir" 
-- el rol "user" que quedó en los metadatos de algunos JWTs.
-- =============================================================================

-- 1. Dar permiso al autenticador para usar este rol
GRANT "user" TO authenticator, postgres, service_role;

-- 2. Asegurar que tenga permisos de lectura/escritura básicos en el esquema public
GRANT USAGE ON SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";

-- 3. Comentario de seguridad
COMMENT ON ROLE "user" IS 'Rol legacy. Se hereda a authenticator para evitar errores de sesión. Recomendar logout/login.';

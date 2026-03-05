-- =============================================================================
-- Migración de Emergencia: Restaurar Compatibilidad de Rol "user"
-- Descripción: Algunos usuarios antiguos o con metadatos obsoletos intentan
-- conectarse usando el rol de Postgres "user". Como este rol fue eliminado
-- para evitar conflictos con la palabra reservada de SQL, las conexiones fallan.
-- Restauramos el rol de forma segura.
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'user') THEN
        CREATE ROLE "user";
    END IF;
END
$$;

-- Aseguramos que el rol "user" tenga los mismos permisos que "authenticated"
-- para que Supabase pueda operar correctamente mientras el usuario actualiza sus metadatos.
GRANT authenticated TO "user";

-- Comentario para auditoría
COMMENT ON ROLE "user" IS 'Rol de compatibilidad para usuarios con metadatos de Auth obsoletos. Hereda de authenticated.';

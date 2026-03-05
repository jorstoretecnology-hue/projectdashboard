-- =============================================================================
-- Migración: Actualizar Roles de Invitaciones
-- =============================================================================

-- 1. Eliminar constraint de roles antiguo
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_app_role_check;

-- 2. Agregar nuevo constraint con roles profesionales
ALTER TABLE public.invitations ADD CONSTRAINT invitations_app_role_check 
CHECK (app_role IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));

-- 3. Comentario
COMMENT ON COLUMN public.invitations.app_role IS 'Rol asignado al usuario al aceptar la invitación, usando el estándar profesional.';

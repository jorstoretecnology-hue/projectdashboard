-- ============================================================================
-- MIGRACIÓN: SISTEMA DE INVITACIONES DE EQUIPO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    app_role text NOT NULL CHECK (app_role IN ('admin', 'staff', 'user')),
    invited_by uuid REFERENCES auth.users(id),
    token text UNIQUE NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 1. Política: Los Admins de un Tenant pueden gestionar sus invitaciones
CREATE POLICY "Admins can manage their tenant invitations"
ON public.invitations
FOR ALL
USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'app_role') IN ('admin', 'superadmin')
);

-- 2. Política: SuperAdmins pueden ver todo
CREATE POLICY "SuperAdmins can view all invitations"
ON public.invitations
FOR SELECT
USING ( (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'superadmin' );

-- 3. Política: Permitir SELECT por token para el flujo de aceptación (registro)
-- Nota: Solo permitimos ver invitaciones pendientes y no expiradas.
CREATE POLICY "Allow public select by token"
ON public.invitations
FOR SELECT
USING (status = 'pending' AND expires_at > now());

-- Comentario para el log de auditoría
COMMENT ON TABLE public.invitations IS 'Almacena invitaciones pendientes para nuevos miembros de la organización.';

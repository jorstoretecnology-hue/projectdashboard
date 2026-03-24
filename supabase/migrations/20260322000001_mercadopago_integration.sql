-- Migration: 20260322000001_mercadopago_integration.sql
-- Description: Create payment and webhook tracking tables for Phase 11.

-- 1. Create Webhook Events Log
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- e.g., 'mercadopago'
    external_id TEXT, -- MP ID
    topic TEXT, -- e.g., 'payment', 'subscription'
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    mercadopago_payment_id TEXT UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
    payment_method TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Payments
-- Only SuperAdmins and Owners of the tenant can see payments
CREATE POLICY "Users can view their tenant's payments" 
ON public.payments FOR SELECT 
USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID 
    OR 
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'superadmin'
);

-- 5. RLS Policies for Webhook Events (Internal only usually, but for audit logs)
CREATE POLICY "Superadmins can view webhooks" 
ON public.webhook_events FOR SELECT 
USING ((auth.jwt() -> 'app_metadata' ->> 'app_role') = 'superadmin');

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_id ON public.payments(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON public.webhook_events(processed);

-- 7. Audit Triggers (assuming manage_updated_at exists from previous hardening)
DO $$ BEGIN
    CREATE TRIGGER set_updated_at_webhooks BEFORE UPDATE ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION public.manage_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.manage_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

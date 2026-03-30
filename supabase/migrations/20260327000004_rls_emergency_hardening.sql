-- =============================================================================
-- MIGRACIÓN: 20260327000004_rls_emergency_hardening.sql
-- Descripción: Fase 16 - Blindaje Global RLS, aislamiento por Tenant y FKs compuestas.
-- Autor: Sistema de Remediación de Seguridad
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. FUNCIONES AUXILIARES DE SEGURIDAD
-- =============================================================================

-- Nueva función unívoca para evitar conflictos ("is not unique") con versiones antiguas
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT (app_metadata->>'app_role') = 'SUPER_ADMIN'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Función robusta para obtener el tenant_id actual del usuario
-- Prioriza el claim de JWT (más seguro) o variable de sesión.
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    -- Intenta obtener de los app_metadata del JWT (Estándar de Supabase)
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid,
    -- Intenta obtener del perfil directamente como fallback seguro
    (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS OPERATIVAS
-- =============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
-- (Asumiendo que tables relacionadas al inventario/taller existen según DATABASE_SCHEMA.md)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
    ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_order_items') THEN
    ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vehicles') THEN
    ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_orders') THEN
    ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_movements') THEN
    ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'domain_events') THEN
    ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;


-- =============================================================================
-- 3. POLÍTICAS RLS (AISLAMIENTO POR TENANT Y BYPASS SUPER_ADMIN)
-- =============================================================================

-- Script dinámico para crear políticas estándar de isolation de tenant en todas 
-- las tablas que contienen un campo 'tenant_id'.
DO $$
DECLARE
    tbl_name text;
    pol_count int;
BEGIN
    FOR tbl_name IN 
        SELECT c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE c.table_schema = 'public' 
          AND c.column_name = 'tenant_id'
          AND t.table_type = 'BASE TABLE'
          -- Excluir tablas de sistema o auditoría especial
          AND c.table_name NOT IN ('audit_logs', 'tracking_access_log', 'tracking_failed_attempts')
    LOOP
        -- Política: Tenant Isolation (Standard)
        EXECUTE format('
            DROP POLICY IF EXISTS "tenant_isolation" ON public.%I;
            CREATE POLICY "tenant_isolation" 
            ON public.%I 
            FOR ALL 
            USING (tenant_id = public.tenant_id()) 
            WITH CHECK (tenant_id = public.tenant_id());
        ', tbl_name, tbl_name);

        -- Política: SuperAdmin Bypass
        EXECUTE format('
            DROP POLICY IF EXISTS "superadmin_bypass" ON public.%I;
            CREATE POLICY "superadmin_bypass" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (public.check_is_super_admin());
        ', tbl_name, tbl_name);
    END LOOP;
END $$;

-- 3.1 Política Especial: sale_items (hereda isolation de sales)
-- Si sale_items no tiene tenant_id (se agregará después, pero preparamos esto en caso contrario)
DROP POLICY IF EXISTS "tenant_isolation_via_sale" ON public.sale_items;
CREATE POLICY "tenant_isolation_via_sale" ON public.sale_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_items.sale_id
    AND s.tenant_id = public.tenant_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_items.sale_id
    AND s.tenant_id = public.tenant_id()
  )
);

DROP POLICY IF EXISTS "superadmin_bypass" ON public.sale_items;
CREATE POLICY "superadmin_bypass" ON public.sale_items FOR ALL TO authenticated USING (public.check_is_super_admin());


-- =============================================================================
-- 4. REFUERZO ESTRUCTURAL Y FOREIGN KEYS (Prevención Cross-Tenant)
-- =============================================================================

-- Para garantizar que nadie pueda usar el ID de un producto de OTRO tenant en su venta.
-- Paso 4.1: Asegurar que haya una restricción UNIQUE en (tenant_id, id) en la tabla 'products'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_id_id_key'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
END $$;

-- Paso 4.2: Asegurar que sale_items tenga tenant_id y popularlo a partir de la venta
DO $$
BEGIN
  -- Agregar la columna si no existe
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.sale_items ADD COLUMN tenant_id uuid;
    
    -- Hacer update desde sales (Operación segura, sin pérdida de datos)
    UPDATE public.sale_items si
    SET tenant_id = s.tenant_id
    FROM public.sales s
    WHERE si.sale_id = s.id;
    
    -- Hacerla obligatoria
    ALTER TABLE public.sale_items ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- Paso 4.3: Cambiar la FK simple por una FK compuesta y estricta
DO $$
BEGIN
  -- Intentamos borrar la fk original (usar nombres comunes que Supabase o Prisma generan)
  ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;
  
  -- Si no existe la FK nueva estructurada, la creamos
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sale_items_tenant_product'
  ) THEN
    ALTER TABLE public.sale_items 
      ADD CONSTRAINT fk_sale_items_tenant_product 
      FOREIGN KEY (tenant_id, product_id) 
      REFERENCES public.products(tenant_id, id);
  END IF;
END $$;


-- =============================================================================
-- 5. OPTIMIZACIÓN DE RENDIMIENTO (Índices Críticos para RLS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_tenant_rls ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_rls ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_rls ON public.sales(tenant_id);
-- Ignorar deleted_at si no existe en el esquema actual, pero intentamos crear índice compuesto:
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'deleted_at') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_tenant_email ON public.customers(tenant_id, email) WHERE deleted_at IS NULL;
  END IF;
END $$;


-- =============================================================================
-- 6. AUDITORÍA DE ACCESOS (Login Attempts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address inet NOT NULL,
  user_agent text,
  success boolean NOT NULL,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time 
ON public.login_attempts(ip_address, created_at)
WHERE success = false;

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- Nadie puede ver login attempts excepto SUPER_ADMIN
CREATE POLICY "login_attempts_admin_only" ON public.login_attempts 
FOR ALL TO authenticated USING (public.is_super_admin());


COMMIT;

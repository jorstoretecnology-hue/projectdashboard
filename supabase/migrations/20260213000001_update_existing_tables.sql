-- =============================================================================
-- Migración 01: Actualizar Tablas Existentes
-- Ref: DATABASE_SCHEMA.md Sección 2 "Tablas que Necesitan Actualización"
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS: Agregar campos de estado y umbrales de stock
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Campo: state
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'state'
  ) THEN
    ALTER TABLE products
      ADD COLUMN state VARCHAR(50) DEFAULT 'DISPONIBLE'
        CHECK (state IN ('DISPONIBLE', 'BAJO_STOCK', 'CRITICO', 'AGOTADO', 'BLOQUEADO'));
  END IF;

  -- Campo: threshold_low
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'threshold_low'
  ) THEN
    ALTER TABLE products ADD COLUMN threshold_low INTEGER DEFAULT 10;
  END IF;

  -- Campo: threshold_critical
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'threshold_critical'
  ) THEN
    ALTER TABLE products ADD COLUMN threshold_critical INTEGER DEFAULT 3;
  END IF;

  -- Campo: is_blocked
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE products ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
  END IF;

  -- Campo: blocked_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'blocked_reason'
  ) THEN
    ALTER TABLE products ADD COLUMN blocked_reason TEXT;
  END IF;

  -- Campo: blocked_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'blocked_at'
  ) THEN
    ALTER TABLE products ADD COLUMN blocked_at TIMESTAMPTZ;
  END IF;

  -- Campo: blocked_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'blocked_by'
  ) THEN
    ALTER TABLE products ADD COLUMN blocked_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES: Asegurar constraint de roles actualizado
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- 2.1 Eliminar constraints previos que puedan bloquear la actualización
  -- (Tanto el nombre nuevo como el antiguo que causó error)
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_app_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_app_role_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  -- 2.2 Sanitizar datos existentes
  -- Convertir cualquier rol no reconocido a 'VIEWER'
  UPDATE profiles
  SET app_role = 'VIEWER'
  WHERE app_role NOT IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER')
     OR app_role IS NULL;

  -- 2.3 Recrear constraint oficial
  ALTER TABLE profiles ADD CONSTRAINT profiles_app_role_check
    CHECK (app_role IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER'));

EXCEPTION
  WHEN duplicate_object THEN NULL; -- ya existe
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TENANTS: Agregar settings JSONB para configuración operativa
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'settings'
  ) THEN
    ALTER TABLE tenants
      ADD COLUMN settings JSONB DEFAULT '{
        "employees_can_see_all_sales": false,
        "employees_can_see_prices": true,
        "allow_negative_stock": false,
        "require_override_reason": true
      }'::jsonb;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CUSTOMERS: Agregar campo phone si no existe (necesario para WhatsApp)
-- ─────────────────────────────────────────────────────────────────────────────

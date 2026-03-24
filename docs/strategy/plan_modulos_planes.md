# Plan de Acción — Módulos y Planes por Industria
**Proyecto:** Antigravity / projectdashboard  
**Fecha:** Marzo 2026  
**Estado:** En ejecución

---

## Contexto

Al registrarse, los tenants quedan con módulos incorrectos o vacíos.  
Este plan corrige la DB y deja el sistema funcionando automáticamente para siempre.

---

## PASO 1 — Detectar y limpiar tenants duplicados

Ejecutar en **Supabase SQL Editor:**

```sql
SELECT name, COUNT(*) as total, ARRAY_AGG(id::text) as ids
FROM public.tenants
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;
```

**Si hay duplicados:**  
Identificar cuál es el tenant real (el que tiene suscripción activa) y eliminar el huérfano:

```sql
-- Verificar cuál tiene suscripción
SELECT t.id, t.name, t.created_at, s.plan_slug
FROM public.tenants t
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
WHERE LOWER(t.name) IN ('jaomart', 'the garage')
ORDER BY t.name, t.created_at;

-- Eliminar el duplicado huérfano (sin suscripción)
-- REEMPLAZAR 'UUID_DEL_DUPLICADO' con el ID real
DELETE FROM public.tenants WHERE id = 'UUID_DEL_DUPLICADO';
```

---

## PASO 2 — Asignar plan a tenants sin suscripción

Los tenants `Casa Roja`, `The Garage`, `The garage` no tienen `plan_slug`.  
Asignarles plan `free` para que el retroactivo los procese:

```sql
-- Ver tenants sin suscripción
SELECT t.id, t.name, t.industry_type
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.tenant_id = t.id
);

-- Crear suscripción free para cada uno
-- REEMPLAZAR los UUIDs con los IDs reales del resultado anterior
INSERT INTO public.subscriptions (tenant_id, plan_slug, status, billing_cycle)
SELECT 
  t.id,
  'free',
  'active',
  'monthly'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.tenant_id = t.id
)
ON CONFLICT (tenant_id) DO NOTHING;
```

---

## PASO 3 — Ejecutar migración completa de módulos

Ejecutar en **Supabase SQL Editor** — copiar exactamente, sin ``` extras:

```sql
-- 3.1 Actualizar compatible_types en módulos universales
UPDATE public.modules_catalog 
SET compatible_types = ARRAY['taller','restaurante','supermercado','ferreteria','gym','glamping','discoteca'] 
WHERE slug IN ('dashboard','inventory','customers','sales','purchases','billing','settings','users','reports');

UPDATE public.modules_catalog 
SET compatible_types = ARRAY['taller'] 
WHERE slug = 'work_orders';

-- 3.2 Actualizar módulos incluidos por plan
UPDATE public.plans SET 
  included_modules = ARRAY['dashboard','inventory','sales'],
  max_customers = 5,
  max_inventory = 10
WHERE slug = 'free';

UPDATE public.plans SET 
  included_modules = ARRAY['dashboard','inventory','customers','sales','purchases','reports','billing','settings','users'],
  max_customers = 200,
  max_inventory = 300
WHERE slug = 'starter';

UPDATE public.plans SET 
  included_modules = ARRAY['dashboard','inventory','customers','sales','purchases','reports','billing','settings','users','work_orders','vehicles','reservations','memberships','accommodations','tables_events'],
  max_customers = 1000,
  max_inventory = 2000
WHERE slug = 'professional';

UPDATE public.plans SET 
  included_modules = ARRAY['dashboard','inventory','customers','sales','purchases','reports','billing','settings','users','work_orders','vehicles','reservations','memberships','accommodations','tables_events'],
  max_customers = NULL,
  max_inventory = NULL
WHERE slug = 'enterprise';

-- 3.3 Función principal de activación
CREATE OR REPLACE FUNCTION activate_modules_for_tenant(
  p_tenant_id UUID,
  p_plan_slug TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_plan_slug TEXT;
  v_industry TEXT;
  v_final_modules TEXT[];
  v_plan_modules TEXT[];
  v_module TEXT;
BEGIN
  v_plan_slug := COALESCE(p_plan_slug, (
    SELECT plan_slug FROM public.subscriptions WHERE tenant_id = p_tenant_id LIMIT 1
  ), 'free');

  SELECT industry_type INTO v_industry
  FROM public.tenants WHERE id = p_tenant_id;

  IF v_plan_slug = 'free' THEN
    v_final_modules := ARRAY['dashboard','inventory','sales'];
  ELSE
    SELECT included_modules INTO v_plan_modules
    FROM public.plans WHERE slug = v_plan_slug;

    SELECT ARRAY_AGG(DISTINCT mc.slug) INTO v_final_modules
    FROM public.modules_catalog mc
    WHERE mc.slug = ANY(v_plan_modules)
      AND (
        mc.compatible_types IS NULL
        OR v_industry = ANY(mc.compatible_types)
      );
  END IF;

  UPDATE public.tenant_modules
  SET is_active = false
  WHERE tenant_id = p_tenant_id;

  IF v_final_modules IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_final_modules LOOP
      INSERT INTO public.tenant_modules (tenant_id, module_slug, is_active, activated_at)
      VALUES (p_tenant_id, v_module, true, NOW())
      ON CONFLICT (tenant_id, module_slug) 
      DO UPDATE SET is_active = true, activated_at = NOW();
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Trigger para nuevos tenants
CREATE OR REPLACE FUNCTION activate_tenant_modules_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM activate_modules_for_tenant(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_activate_modules ON public.tenants;
CREATE TRIGGER trigger_activate_modules
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION activate_tenant_modules_on_signup();

-- 3.5 RETROACTIVO: corregir todos los tenants existentes
DO $$
DECLARE
  v_tenant RECORD;
BEGIN
  FOR v_tenant IN 
    SELECT DISTINCT id FROM public.tenants
  LOOP
    PERFORM activate_modules_for_tenant(v_tenant.id);
  END LOOP;
END $$;
```

---

## PASO 4 — Verificar resultado

```sql
SELECT 
  t.name,
  t.industry_type,
  s.plan_slug,
  COUNT(tm.id) as modulos_activos,
  ARRAY_AGG(tm.module_slug ORDER BY tm.module_slug) as modulos
FROM public.tenants t
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
LEFT JOIN public.tenant_modules tm ON tm.tenant_id = t.id AND tm.is_active = true
GROUP BY t.name, t.industry_type, s.plan_slug
ORDER BY t.name;
```

**Resultado esperado:**

| Tenant | Plan | Módulos esperados |
|--------|------|-------------------|
| ACME (taller, enterprise) | enterprise | 15 módulos incluye work_orders + vehicles |
| Agencia Demo (glamping, pro) | professional | 15 módulos incluye accommodations + reservations |
| Demo Client (gym, free) | free | dashboard + inventory + sales |
| Empresa Debug (taller, free) | free | dashboard + inventory + sales |
| jaomart (taller, free) | free | dashboard + inventory + sales |
| Retail Plus (ferreteria, starter) | starter | 9 módulos universales |
| Taller Servicel (taller, free) | free | dashboard + inventory + sales |

---

## PASO 5 — Actualizar onboarding en código

En `src/app/onboarding/actions.ts`, al final de la función que crea el tenant agregar:

```typescript
// Activar módulos según plan e industria
const { error: modulesError } = await supabase
  .rpc('activate_modules_for_tenant', {
    p_tenant_id: tenantId,
    p_plan_slug: 'free'
  })

if (modulesError) {
  console.error('[Onboarding] Error activando módulos:', modulesError)
  // No bloquear el flujo — el trigger ya lo maneja como fallback
}
```

```bash
npx tsc --noEmit
git add -A && git commit -m "feat: activate modules automatically on tenant signup"
```

---

## PASO 6 — Conectar pricing en el frontend

Crear `src/lib/pricing.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'

export type BillingCycle = 'monthly' | 'yearly'

// Obtener precio real para un tenant según su industria
export async function getTenantPrice(
  tenantId: string,
  planSlug: string,
  billingCycle: BillingCycle = 'monthly'
): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase.rpc('get_tenant_price', {
    p_tenant_id: tenantId,
    p_plan_slug: planSlug,
    p_billing_cycle: billingCycle
  })
  return data ?? 0
}

// Obtener tabla de precios para una industria (para mostrar en billing)
export async function getIndustryPricing(industryType: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('industry_pricing')
    .select('*')
    .eq('industry_type', industryType)
    .order('plan_slug')
  return data ?? []
}

// Formatear precio en COP
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Calcular ahorro anual
export function yearlyDiscount(monthly: number, yearly: number): string {
  const saving = (monthly * 12) - yearly
  const pct = Math.round((saving / (monthly * 12)) * 100)
  return `Ahorras ${formatCOP(saving)} (${pct}% off)`
}
```

---

## PASO 7 — Próximos pasos (después de validar)

| Prioridad | Tarea | Impacto |
|-----------|-------|---------|
| 1 | Integrar MercadoPago usando `get_tenant_price()` | 💰 Primer cobro real |
| 2 | Página de billing que muestre precios por industria | UX upgrade |
| 3 | Facturación electrónica DIAN | Requisito Colombia |
| 4 | UI de módulos — mostrar locked con upgrade prompt | Conversión |

---

## Resumen del flujo final

```
Registro → elige industria
    ↓
Onboarding crea tenant (industry_type guardado)
    ↓
Trigger activa módulos según plan + industria (automático)
    ↓
Free: dashboard + inventory + sales
Starter: 9 módulos universales filtrados por industria  
Professional/Enterprise: todos los módulos compatibles
    ↓
Billing muestra industry_pricing con precio real
    ↓
MercadoPago cobra get_tenant_price(tenantId, planSlug)
    ↓
Upgrade → activate_modules_for_tenant recalcula módulos
```

/**
 * Pricing Library - Precios dinámicos por tenant e industria
 * 
 * @see {@link ../../supabase/migrations/20260314000001_get_tenant_price.sql} Función RPC
 */

import { createClient } from '@/lib/supabase/client'
import type { PlanTier } from '@/core/billing/plans'

export type BillingCycle = 'monthly' | 'yearly'

/**
 * Obtener precio real para un tenant según su industria y plan
 */
export async function getTenantPrice(
  tenantId: string,
  planSlug: PlanTier,
  billingCycle: BillingCycle = 'monthly'
): Promise<number> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_tenant_price', {
    p_tenant_id: tenantId,
    p_plan_slug: planSlug,
    p_billing_cycle: billingCycle
  })

  if (error) {
    console.error('[getTenantPrice] Error:', error)
    return 0
  }

  return data ?? 0
}

/**
 * Obtener tabla de precios para una industria (para mostrar en billing)
 */
export async function getIndustryPricing(industryType: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('industry_pricing')
    .select('industry_type, plan_slug, price_monthly, price_yearly, currency, features')
    .eq('industry_type', industryType)
    .order('plan_slug')

  if (error) {
    console.error('[getIndustryPricing] Error:', error)
    return []
  }

  return data ?? []
}

/**
 * Formatear precio en Pesos Colombianos (COP)
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Calcular ahorro anual
 */
export function yearlyDiscount(monthly: number, yearly: number): string {
  const saving = (monthly * 12) - yearly
  const pct = Math.round((saving / (monthly * 12)) * 100)
  return `Ahorras ${formatCOP(saving)} (${pct}% off)`
}

/**
 * Obtener precio base del plan (sin descuentos)
 */
export function getPlanBasePrice(planSlug: PlanTier, billingCycle: BillingCycle = 'monthly'): number {
  const { PLANS } = require('@/core/billing/plans')
  const plan = PLANS[planSlug]
  
  if (!plan) return 0
  
  return billingCycle === 'yearly' 
    ? plan.price_yearly || (plan.price_monthly * 12)
    : plan.price_monthly
}

"use client"

import { useUser } from "@/providers"
import { FeatureFlag } from "@/config/permissions"

/**
 * useFeature
 * --------------------
 * Hook para verificar si una funcionalidad SaaS (CRM, Inventory, Billing)
 * está habilitada para el Tenant actual.
 * 
 * @param feature La feature a verificar
 * @returns boolean
 */
export function useFeature(feature: FeatureFlag): boolean {
  const { canAccessFeature } = useUser()
  return canAccessFeature(feature)
}

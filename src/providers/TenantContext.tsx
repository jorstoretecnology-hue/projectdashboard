'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

import type { FeatureFlag } from '@/config/permissions';
import type { TenantConfig, PlanType } from '@/config/tenants';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { useTenantRealtime } from '@/hooks/useTenantRealtime';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { tenantService } from '@/modules/tenants/services/tenant.service';
import type { IndustryType } from '@/types';

import { useUser } from './AuthContext';

/* ──────────────────────────────────────────────
   Subscription & Addon types
   ────────────────────────────────────────────── */

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended';

export interface TenantSubscription {
  id: string;
  plan_slug: string;
  status: SubscriptionStatus;
  billing_cycle: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

export interface TenantAddon {
  module_slug: string;
  monthly_price: number; // INTEGER COP
  activated_at: string;
}

/* ──────────────────────────────────────────────
   DbTenantRow — tipo exacto del query Supabase
   ────────────────────────────────────────────── */

interface DbTenantRow {
  id: string;
  name: string;
  plan: string;
  industry_type: string;
  active_modules: string[] | null;
  is_active: boolean;
  branding: Record<string, unknown> | null;
  feature_flags: string[] | null;
  created_at: string;
  subscription: {
    id: string;
    plan_slug: string;
    status: string;
    billing_cycle: string | null;
    current_period_end: string | null;
    trial_ends_at: string | null;
  } | null;
  addons: Array<{
    module_slug: string;
    monthly_price: number;
    activated_at: string;
  }> | null;
}

/* ──────────────────────────────────────────────
   Context interface
   ────────────────────────────────────────────── */

interface CreateTenantInput {
  name: string;
  plan: PlanType;
  industryType: IndustryType;
  customDomain?: string;
  activeModules?: string[];
  branding?: { primaryColor: string };
  maxUsers?: number;
}

interface TenantContextType {
  currentTenant: TenantConfig | null;
  setCurrentTenant: (tenantId: string) => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
  setIsSuperAdmin: (value: boolean) => void;
  tenants: TenantConfig[];
  updateTenant: (tenantId: string, updates: Partial<TenantConfig>) => void;
  createTenant: (data: CreateTenantInput) => Promise<TenantConfig>;
  refreshTenants: () => Promise<void>;
  // Subscription
  subscription: TenantSubscription | null;
  addons: TenantAddon[];
  isSubscriptionBlocked: boolean;
  isModuleActive: (slug: string) => boolean;
  // Simulation state
  simulatedPlan: string | null;
  setSimulatedPlan: (plan: string | null) => void;
  effectivePlan: string | null;
  isSimulated: boolean;
  resetSimulation: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/* ──────────────────────────────────────────────
   Provider
   ────────────────────────────────────────────── */

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const { user, isLoading: authLoading } = useUser();
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [addons, setAddons] = useState<TenantAddon[]>([]);

  // Simulation state
  const [simulatedPlan, setSimulatedPlan] = useState<string | null>(null);

  // Tenant actual derivado del estado de tenants y el ID seleccionado
  const currentTenant = tenants.find((t) => t.id === currentTenantId) || null;

  // Effective plan: simulated or real
  const effectivePlan = simulatedPlan || currentTenant?.plan || null;
  const isSimulated = simulatedPlan !== null;

  // Subscription status checks
  const isSubscriptionBlocked =
    subscription?.status === 'past_due' || subscription?.status === 'suspended';

  // Module membership: base plan + addon purchases
  const isModuleActive = useCallback(
    (slug: string): boolean => {
      if (!currentTenant) return false;
      const inBase = currentTenant.activeModules?.includes(slug) ?? false;
      const inAddons = addons.some((a) => a.module_slug === slug);
      return inBase || inAddons;
    },
    [currentTenant, addons],
  );

  useEffect(() => {
    const initializeFromAuth = async () => {
      if (authLoading) return;
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, app_role')
        .eq('id', user.id)
        .single();

      const rawRole = profile?.app_role || user.app_metadata?.app_role || 'VIEWER';
      const role = rawRole.toUpperCase();
      const tenantId = profile?.tenant_id || user.app_metadata?.tenant_id;
      const superAdmin = role === 'SUPER_ADMIN';
      setIsSuperAdmin(superAdmin);

      try {
        if (superAdmin) {
          const allTenants = await tenantService.listAllTenants();
          const mapped = allTenants.map(mapDbTenant);
          setTenants(mapped);
          if (mapped.length > 0 && !currentTenantId) setCurrentTenantId(mapped[0].id);
        } else if (tenantId) {
          // Single query: tenant + subscription + addons
          const { data, error } = await supabase
            .from('tenants')
            .select(
              `
                id,
                name,
                plan,
                industry_type,
                active_modules,
                is_active,
                branding,
                feature_flags,
                created_at,
                subscription:subscriptions(
                  id,
                  plan_slug,
                  status,
                  billing_cycle,
                  current_period_end,
                  trial_ends_at
                ),
                addons:tenant_subscription_items(
                  module_slug,
                  monthly_price,
                  activated_at
                )
              `,
            )
            .eq('id', tenantId)
            .single();

          if (error) {
            if (error.code !== 'PGRST116') {
              logger.error('[TenantContext] Error fetching tenant', { error, tenantId });
            }
          } else if (data) {
            // Cast through unknown — Supabase's inferred type has SelectQueryError
            // for addons (table not in generated types yet) and nullable scalars
            const row = data as unknown as DbTenantRow;

            const mapped = mapDbTenantWithSubscription(row);
            setCurrentTenantId(mapped.id);
            setTenants([mapped]);

            // Subscription (single object from .single() join)
            const sub = (row.subscription ?? null) as TenantSubscription | null;
            setSubscription(sub);

            // Addons (array or null — table may not be in generated types yet)
            const addonList = (row.addons ?? []) as TenantAddon[];
            setAddons(addonList);
          }
        } else {
          logger.warn('[TenantContext] No tenant_id for user');
        }
      } catch (error) {
        logger.error('[TenantContext] Init error', error);
      }

      setIsLoading(false);
    };

    initializeFromAuth();
  }, [user, authLoading, supabase, currentTenantId]);

  // Mapeo sin subscription (SuperAdmin list)
  const mapDbTenant = (t: Record<string, unknown>): TenantConfig => {
    const db = t as {
      id: string;
      name: string;
      plan: string;
      industry_type: string;
      active_modules: string[] | null;
      is_active: boolean;
      branding: Record<string, unknown> | null;
      feature_flags: string[] | null;
      created_at: string;
    };

    return {
      id: db.id,
      name: db.name,
      plan: db.plan as PlanType,
      industryType: db.industry_type as IndustryType,
      activeModules: db.active_modules ?? [],
      featureFlags: (db.feature_flags ?? []) as FeatureFlag[],
      isActive: db.is_active ?? true,
      branding:
        db.branding && Object.keys(db.branding).length > 0
          ? { primaryColor: String(db.branding.primaryColor ?? '221 83% 53%') }
          : { primaryColor: '221 83% 53%' },
      createdAt: new Date(db.created_at).toLocaleDateString(),
    };
  };

  // Mapeo con subscription + addons (tenant individual)
  const mapDbTenantWithSubscription = (row: DbTenantRow): TenantConfig => {
    return {
      id: row.id,
      name: row.name,
      plan: row.plan as PlanType,
      industryType: row.industry_type as IndustryType,
      activeModules: row.active_modules ?? [],
      featureFlags: (row.feature_flags ?? []) as FeatureFlag[],
      isActive: row.is_active ?? true,
      branding:
        row.branding && Object.keys(row.branding).length > 0
          ? { primaryColor: String(row.branding.primaryColor ?? '221 83% 53%') }
          : { primaryColor: '221 83% 53%' },
      createdAt: new Date(row.created_at).toLocaleDateString(),
    };
  };

  // Hook delegado: branding CSS (SRP)
  useTenantBranding(currentTenant);

  // Hook delegado: realtime subscriptions (SRP)
  const handleRealtimeUpdate = useCallback(
    (updatedFields: Partial<TenantConfig>) => {
      setTenants((prev) =>
        prev.map((t) => (t.id === currentTenantId ? { ...t, ...updatedFields } : t)),
      );
    },
    [currentTenantId],
  );
  useTenantRealtime(currentTenantId, handleRealtimeUpdate);

  const updateTenant = async (tenantId: string, updates: Partial<TenantConfig>) => {
    const oldTenant = tenants.find((t) => t.id === tenantId);
    try {
      if (updates.plan && oldTenant)
        await tenantService.updatePlan(tenantId, updates.plan, oldTenant.plan);
      if (updates.activeModules && oldTenant)
        await tenantService.updateModules(tenantId, updates.activeModules, oldTenant.activeModules);
    } catch (error) {
      logger.error('[TenantContext] Error updating tenant', error);
    }
    setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, ...updates } : t)));
  };

  const createTenant = async (data: CreateTenantInput) => {
    try {
      const newTenant = await tenantService.createTenant({
        name: data.name,
        plan: data.plan,
        industry_type: data.industryType,
        custom_domain: data.customDomain,
        active_modules: data.activeModules || ['Dashboard'],
        branding: data.branding || { primaryColor: '221 83% 53%' },
        max_users: data.maxUsers,
      });
      const mapped = mapDbTenant(newTenant as Record<string, unknown>);
      setTenants((prev) => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      logger.error('[TenantContext] Error creating tenant', error);
      throw error;
    }
  };

  const refreshTenants = async () => {
    if (!isSuperAdmin) return;
    const all = await tenantService.listAllTenants();
    setTenants(all.map((t: unknown) => mapDbTenant(t as Record<string, unknown>)));
  };

  const setCurrentTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    localStorage.setItem('currentTenantId', tenantId);
  };

  const handleSetSuperAdmin = (value: boolean) => {
    setIsSuperAdmin(value);
    if (typeof window !== 'undefined') localStorage.setItem('isSuperAdmin', String(value));
  };

  const resetSimulation = () => {
    setSimulatedPlan(null);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        isLoading,
        isSuperAdmin,
        setIsSuperAdmin: handleSetSuperAdmin,
        tenants,
        updateTenant,
        createTenant,
        refreshTenants,
        subscription,
        addons,
        isSubscriptionBlocked,
        isModuleActive,
        simulatedPlan,
        setSimulatedPlan,
        effectivePlan,
        isSimulated,
        resetSimulation,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};

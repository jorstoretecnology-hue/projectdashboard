'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

import type { TenantConfig, PlanType, TenantBranding } from '@/config/tenants';
import { tenantService } from '@/modules/tenants/services/tenant.service';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { useTenantRealtime } from '@/hooks/useTenantRealtime';
import { logger } from '@/lib/logger';
import type { IndustryType } from '@/types';

import { useUser } from './AuthContext';

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
  // Simulation state
  simulatedPlan: string | null;
  setSimulatedPlan: (plan: string | null) => void;
  effectivePlan: string | null;
  isSimulated: boolean;
  resetSimulation: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const { user, isLoading: authLoading } = useUser();
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // Simulation state
  const [simulatedPlan, setSimulatedPlan] = useState<string | null>(null);

  // Tenant actual derivado del estado de tenants y el ID seleccionado
  const currentTenant = tenants.find((t) => t.id === currentTenantId) || null;

  // Effective plan: simulated or real
  const effectivePlan = simulatedPlan || currentTenant?.plan || null;
  const isSimulated = simulatedPlan !== null;

  useEffect(() => {
    const initializeFromAuth = async () => {
      if (authLoading) return;
      if (!user) { setIsLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, app_role')
        .eq('id', user.id)
        .single();

      const rawRole = profile?.app_role || user.app_metadata?.app_role || 'VIEWER';
      const role = rawRole.toUpperCase();
      const tenantId = profile?.tenant_id || user.app_metadata?.tenant_id;
      const superAdmin = role === 'SUPER_ADMIN';

      logger.log('[TenantContext] Initializing', { email: user.email, role, tenantId, superAdmin });
      setIsSuperAdmin(superAdmin);

      try {
        if (superAdmin) {
          const allTenants = await tenantService.listAllTenants();
          const mapped = allTenants.map(mapDbTenant);
          setTenants(mapped);
          if (mapped.length > 0 && !currentTenantId) setCurrentTenantId(mapped[0].id);
        } else if (tenantId) {
          const dbTenant = await tenantService.getTenantById(tenantId);
          if (dbTenant) {
            setCurrentTenantId(dbTenant.id);
            setTenants([mapDbTenant(dbTenant)]);
          } else {
            logger.error('[TenantContext] Tenant not found', tenantId);
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
  }, [user, authLoading]);

  // Función auxiliar de mapeo centralizada (DRY)
  const mapDbTenant = (t: Record<string, unknown>): TenantConfig => {
    const db = t as unknown as {
      id: string;
      name: string;
      plan: string;
      industry_type: string;
      active_modules: string[];
      is_active: boolean;
      created_at: string;
      branding?: Record<string, unknown>;
      feature_flags?: string[];
    };
    
    return {
      id: db.id,
      name: db.name,
      plan: db.plan as PlanType,
      industryType: db.industry_type as IndustryType,
      activeModules: db.active_modules || [],
      featureFlags: (db.feature_flags || []) as any[], // Temporarily as any[] until specific flags are defined
      isActive: db.is_active ?? true,
      branding: (db.branding && Object.keys(db.branding).length > 0 
        ? db.branding 
        : { primaryColor: '221 83% 53%' }) as unknown as TenantBranding,
      createdAt: new Date(db.created_at).toLocaleDateString(),
    };
  };

  // Hook delegado: branding CSS (SRP)
  useTenantBranding(currentTenant);

  // Hook delegado: realtime subscriptions (SRP)
  const handleRealtimeUpdate = useCallback((updatedFields: Partial<TenantConfig>) => {
    setTenants(prev => prev.map(t => t.id === currentTenantId ? { ...t, ...updatedFields } : t));
  }, [currentTenantId]);
  useTenantRealtime(currentTenantId, handleRealtimeUpdate);

  const updateTenant = async (tenantId: string, updates: Partial<TenantConfig>) => {
    const oldTenant = tenants.find(t => t.id === tenantId);
    try {
      if (updates.plan && oldTenant) await tenantService.updatePlan(tenantId, updates.plan, oldTenant.plan);
      if (updates.activeModules && oldTenant) await tenantService.updateModules(tenantId, updates.activeModules, oldTenant.activeModules);
    } catch (error) {
      logger.error('[TenantContext] Error updating tenant', error);
    }
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));
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
      setTenants(prev => [mapped, ...prev]);
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

  // Branding y Realtime delegados a hooks especializados (SRP)
  // Ver: useTenantBranding.ts y useTenantRealtime.ts

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

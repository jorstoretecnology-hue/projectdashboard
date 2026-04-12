'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

import { buildActiveModules, type ActiveModule } from '@/core/modules/module-registry';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';

import { useUser } from './AuthContext';

interface ModuleContextValue {
  modules: ActiveModule[];
  activeModuleSlugs: string[];
  isModuleActive: (slug: string) => boolean;
  isLoading: boolean;
  // Legacy support
  toggleModule: (id: string) => void;
  mounted: boolean;
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

export const ModuleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const supabase = createClient();
  const [activeModuleSlugs, setActiveModuleSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckedUser, setLastCheckedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      if (lastCheckedUser) {
        setLastCheckedUser(null);
        setActiveModuleSlugs([]);
      }
      setIsLoading(false);
      return;
    }

    // Guard: Evitar recargas si el usuario es el mismo (excepto carga inicial)
    if (user.id === lastCheckedUser && activeModuleSlugs.length > 0) {
      setIsLoading(false);
      return;
    }

    const loadModules = async () => {
      setIsLoading(true);
      try {
        let tenantId = user.app_metadata?.tenant_id as string | undefined;

        if (!tenantId) {
          logger.warn('[ModuleContext] JWT sin tenant_id, buscando en profiles', {
            userId: user.id,
          });
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();
          tenantId = profile?.tenant_id ?? undefined;
        }

        if (!tenantId) {
          logger.error('[ModuleContext] No se encontró tenant_id', { userId: user.id });
          setActiveModuleSlugs([]);
          return;
        }

        const { data: tenantModules, error } = await supabase
          .from('tenant_modules')
          .select('module_slug')
          .eq('tenant_id', tenantId)
          .eq('is_active', true);

        if (error) {
          logger.error('[ModuleContext] Error loading modules:', error);
        }

        const slugs = (tenantModules || []).map((m) => m.module_slug);
        setActiveModuleSlugs(slugs);
        setLastCheckedUser(user.id);
      } catch (err) {
        logger.error('[ModuleContext] Crash loading modules:', err);
        setActiveModuleSlugs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, [user?.id, lastCheckedUser, user?.app_metadata?.tenant_id, activeModuleSlugs.length, supabase]);

  // MEMOIZACIÓN: Evita que todos los componentes que escuchan el contexto se re-rendericen
  // si los slugs no han cambiado.
  const modules = useMemo(() => buildActiveModules(activeModuleSlugs), [activeModuleSlugs]);

  const isModuleActive = useCallback(
    (slug: string) => activeModuleSlugs.some((s) => s.toLowerCase() === slug.toLowerCase()),
    [activeModuleSlugs],
  );

  const value = useMemo(
    () => ({
      modules,
      activeModuleSlugs,
      isModuleActive,
      isLoading,
      toggleModule: () => {},
      mounted: !isLoading,
    }),
    [modules, activeModuleSlugs, isModuleActive, isLoading],
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
};

export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) throw new Error('useModuleContext must be used within ModuleProvider');
  return context;
};

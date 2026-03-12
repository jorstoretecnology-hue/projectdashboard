'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildActiveModules, type ActiveModule } from '@/core/modules/module-registry';
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

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadModules = async () => {
      setIsLoading(true);
      try {
        // Leer módulos activos del tenant desde Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile?.tenant_id) {
          setActiveModuleSlugs(['dashboard', 'settings', 'billing']);
          return;
        }

        const { data: tenantModules } = await supabase
          .from('tenant_modules')
          .select('module_slug')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true);

        const slugs = (tenantModules || []).map(m => m.module_slug);
        setActiveModuleSlugs(slugs.length > 0 ? slugs : ['dashboard', 'settings', 'billing']);
      } catch (err) {
        console.error('[ModuleContext] Error loading modules:', err);
        setActiveModuleSlugs(['dashboard', 'settings', 'billing']);
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, [user?.id]);

  const modules = buildActiveModules(activeModuleSlugs);
  const isModuleActive = (slug: string) =>
    activeModuleSlugs.map(s => s.toLowerCase()).includes(slug.toLowerCase());

  return (
    <ModuleContext.Provider value={{
      modules,
      activeModuleSlugs,
      isModuleActive,
      isLoading,
      toggleModule: () => {}, // legacy no-op
      mounted: !isLoading,
    }}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) throw new Error('useModuleContext must be used within ModuleProvider');
  return context;
};

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildActiveModules, type ActiveModule } from '@/core/modules/module-registry';
import { logger } from '@/lib/logger';
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
        // En lugar de console.log, usamos el Logger estructurado (Regla 1.7)
        logger.log('[ModuleContext] Iniciando chequeo de módulos', { userId: user.id });

        // Leer módulos activos del tenant desde Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile?.tenant_id) {
          logger.warn('[ModuleContext] Perfil sin tenant_id asociado', { userId: user.id });
          setActiveModuleSlugs([]);
          return;
        }
        
        logger.log('[ModuleContext] Perfil cargado', { tenantId: profile.tenant_id });

        const { data: tenantModules, error } = await supabase
          .from('tenant_modules')
          .select('module_slug')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true);

        if (error) {
          logger.error('[ModuleContext] Error en Supabase al cargar módulos', { error });
        }

        const slugs = (tenantModules || []).map(m => m.module_slug);
        
        if (slugs.length === 0) {
          logger.warn('[ModuleContext] Tenant sin módulos activos', { 
            tenant_id: profile.tenant_id 
          });
        }
        setActiveModuleSlugs(slugs);
      } catch (err) {
        logger.error('[ModuleContext] Crash loading modules:', { err });
        setActiveModuleSlugs([]);
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

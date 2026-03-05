'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

import { MODULES_CONFIG } from '@/config/modules';

export type ModuleState = Record<string, boolean>;

interface ModuleContextValue {
  modules: ModuleState;
  toggleModule: (id: string) => void;
  isModuleActive: (id: string) => boolean;
  mounted: boolean;
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

export const ModuleProvider = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  
  // Inicializar con todos los módulos activos por defecto
  const [modules, setModules] = useState<ModuleState>(() => {
    const initial: ModuleState = {};
    MODULES_CONFIG.forEach(m => {
      initial[m.id] = true; // Todos activos por defecto
    });
    return initial;
  });

  // Marcar como montado y cargar estado guardado
  useEffect(() => {
    setMounted(true);
    
    // Cargar desde localStorage si existe
    const saved = localStorage.getItem('module-states');
    if (saved) {
      try {
        setModules(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading module states:', e);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('module-states', JSON.stringify(modules));
    }
  }, [modules, mounted]);

  const toggleModule = (id: string) => {
    setModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isModuleActive = (id: string) => modules[id] ?? true;

  return (
    <ModuleContext.Provider value={{ modules, toggleModule, isModuleActive, mounted }}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleContext must be used within ModuleProvider');
  }
  return context;
};

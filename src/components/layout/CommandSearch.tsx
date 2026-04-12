'use client';

import { Search, Command, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

import { useTenant } from '@/providers';
import { useModuleContext } from '@/providers/ModuleContext';

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandSearch = ({ isOpen, onClose }: CommandSearchProps) => {
  const [query, setQuery] = useState('');
  const { currentTenant } = useTenant();

  // Cerrar con la tecla Esc (NO manejar Ctrl+K aquí, eso lo hace Navbar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Limpiar query al cerrar
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // ModuleContext ya filtra por tenant — solo filtramos por query
  const { modules } = useModuleContext();

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return modules;

    return modules.filter((m) =>
      m.navigation.some(
        (nav) =>
          nav.label.toLowerCase().includes(normalizedQuery) ||
          nav.path.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query, modules]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal de Búsqueda */}
      <div
        className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
      >
        {/* Header con Input */}
        <div className="flex items-center p-4 border-b border-border">
          <Search className="text-muted-foreground mr-3" size={20} aria-hidden="true" />
          <input
            autoFocus
            placeholder="¿Qué necesitas buscar?…"
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/20 rounded-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar módulos"
          />
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            aria-label="Cerrar búsqueda"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          <p
            id="search-title"
            className="text-[10px] font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider"
          >
            Módulos disponibles
            {currentTenant && (
              <span className="ml-2 text-primary">({currentTenant.name})</span>
            )}
          </p>

          {filteredModules.length > 0 ? (
            filteredModules.flatMap((module) =>
              module.navigation.map((nav) => (
                <a
                  key={`${module.key}-${nav.path}`}
                  href={nav.path}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors group"
                >
                  <div className="p-2 bg-muted rounded-md group-hover:bg-primary/20 transition-colors">
                    <span className="text-sm font-mono text-muted-foreground">{nav.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{nav.label}</span>
                    <span className="text-xs text-muted-foreground">{nav.path}</span>
                  </div>
                </a>
              ))
            )
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {query
                ? `No se encontraron resultados para "${query}"`
                : 'No hay módulos disponibles para este cliente'}
            </div>
          )}
        </div>

        {/* Footer con Atajos */}
        <div className="bg-muted/50 p-3 flex justify-between items-center border-t border-border">
          <div className="flex gap-4">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <kbd className="border border-border bg-card px-1 rounded text-[9px]">Enter</kbd>
              seleccionar
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <kbd className="border border-border bg-card px-1 rounded text-[9px]">ESC</kbd>
              cerrar
            </span>
          </div>
          <Command size={14} className="text-muted-foreground/50" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
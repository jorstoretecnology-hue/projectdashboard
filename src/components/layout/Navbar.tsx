'use client';

import { Search, Bell, Moon, Sun, Settings, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

import { CommandSearch } from './CommandSearch';
import { TenantSelector } from './TenantSelector';

import { useUser } from '@/providers';

export const Navbar = () => {
  const { user, signOut } = useUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper para iniciales
  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  // Atajo Ctrl + K para abrir búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar menú de usuario al hacer click fuera
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Search Bar - Modern & Compact */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className="cursor-pointer hidden md:flex items-center w-full max-w-sm bg-muted/50 hover:bg-muted/80 border border-transparent hover:border-border/50 rounded-full px-4 py-2 transition-all duration-200 group"
          >
            <Search
              size={16}
              className="text-muted-foreground/70 group-hover:text-primary transition-colors"
            />
            <span className="ml-3 text-sm text-muted-foreground/70 font-medium">Buscar...</span>
            <div className="ml-auto flex gap-1 transform scale-90 opacity-60">
              <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 text-[10px] font-medium bg-background border border-border rounded shadow-sm">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 hover:bg-muted/80 rounded-full transition-colors"
            aria-label="Abrir búsqueda"
          >
            <Search size={20} className="text-muted-foreground" />
          </button>

          {/* Right Section Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Tenant Selector */}
            <TenantSelector />

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative p-2.5 hover:bg-muted/80 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? (
                  <Sun
                    size={18}
                    className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                  />
                ) : (
                  <Moon
                    size={18}
                    className="text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                  />
                )}
              </button>
            )}

            {/* Notifications */}
            <button className="relative p-2.5 hover:bg-muted/80 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-muted-foreground hover:text-foreground">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background animate-pulse" />
            </button>

            {/* User Menu */}
            <div
              className="relative pl-2 sm:pl-4 border-l border-border/40"
              data-user-menu
            >
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-muted/50 transition-all border border-transparent hover:border-border/50 group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-primary/20 ring-2 ring-background group-hover:scale-105 transition-transform">
                  {getInitials()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-4 border-b border-border/50 bg-muted/30">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <User size={16} />
                      Perfil
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <Settings size={16} />
                      Configuración
                    </Link>
                  </div>

                  <div className="p-1.5 border-t border-border/50">
                    <button 
                      onClick={() => signOut()}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Command Search Modal */}
      <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
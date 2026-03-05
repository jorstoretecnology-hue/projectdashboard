'use client';

import { ChevronLeft, ShieldAlert as shieldAlertIcon, ShieldAlert, Users, LayoutDashboard, Settings, LogOut, Package, Crown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const SUPERADMIN_MENU = [
  { name: 'Executive Dashboard', icon: Crown, path: '/superadmin/dashboard' },
  { name: 'Control de Tenants', icon: LayoutDashboard, path: '/superadmin' },
  { name: 'Inventario Global', icon: Package, path: '/superadmin/inventory' },
  { name: 'Cartera Clientes', icon: Users, path: '/superadmin/customers' },
  { name: 'IAM & Usuarios', icon: shieldAlertIcon, path: '/superadmin/users' },
  { name: 'Configuración', icon: Settings, path: '/superadmin/config' },
];

export const SuperAdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sa-sidebar-collapsed');
    if (savedState) setIsCollapsed(savedState === 'true');
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sa-sidebar-collapsed', String(newState));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (!mounted) {
    return <aside className="w-20 h-screen bg-card border-r border-border" />;
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out z-40 overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header - Distinctive for SuperAdmin */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border/50 shrink-0">
        <div className={cn('flex items-center gap-3 overflow-hidden', isCollapsed ? 'justify-center w-full' : '')}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldAlert size={18} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-sidebar-primary">SUPER ADMIN</span>
              <span className="text-[10px] text-sidebar-foreground/70 uppercase font-bold tracking-tight">Main Controller</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {!isCollapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-widest">Administración Global</p>
        )}
        {SUPERADMIN_MENU.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon size={20} className={cn(isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground')} />
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border/50 space-y-2">
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
            'text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Salir del Sistema</span>}
        </button>

        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className={cn(
            'h-10 w-full mt-2 flex items-center p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isCollapsed ? 'justify-center' : 'justify-start px-3'
          )}
        >
          <ChevronLeft className={cn('transition-transform duration-300', isCollapsed && 'rotate-180')} size={20} />
          {!isCollapsed && <span className="ml-3 text-xs">Ocultar panel</span>}
        </Button>
      </div>
    </aside>
  );
};

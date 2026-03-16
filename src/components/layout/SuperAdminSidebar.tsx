'use client';

import { ChevronLeft, ShieldAlert as shieldAlertIcon, ShieldAlert, Users, LayoutDashboard, Settings, LogOut, Package, Crown, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const SUPERADMIN_MENU = [
  { name: 'Executive Dashboard', icon: Crown, path: '/console/dashboard', color: 'text-primary' },
  { name: 'Control de Tenants', icon: LayoutDashboard, path: '/console', color: 'text-blue-500' },
  { name: 'Inventario Global', icon: Package, path: '/console/inventory', color: 'text-emerald-500' },
  { name: 'Cartera Clientes', icon: Users, path: '/console/customers', color: 'text-violet-500' },
  { name: 'IAM & Usuarios', icon: shieldAlertIcon, path: '/console/users', color: 'text-amber-500' },
  { name: 'Configuración', icon: Settings, path: '/console/config', color: 'text-slate-400' },
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
    return <aside className="w-20 h-screen bg-slate-950 border-r border-white/5" />;
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-500 ease-in-out z-40 overflow-hidden shadow-sm',
        isCollapsed ? 'w-20' : 'w-72',
      )}
    >
      {/* Header Premium */}
      <div className="h-24 flex items-center px-6 border-b border-white/5 shrink-0">
        <div className={cn('flex items-center gap-4 overflow-hidden', isCollapsed ? 'justify-center w-full' : '')}>
          <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                <ShieldAlert size={22} className="animate-pulse" />
              </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-black text-white text-base tracking-tighter italic">SMART <span className="text-primary">OS</span></span>
              <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Super Admin</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
        {!isCollapsed && (
          <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Navegación Core</p>
        )}
        {SUPERADMIN_MENU.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'bg-secondary text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-secondary/50',
              )}
            >
              {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
              )}
              <item.icon 
                size={22} 
                className={cn(
                    "transition-all duration-300",
                    isActive ? item.color : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110",
                    isActive && "drop-shadow-[0_0_8px_currentColor]"
                )} 
              />
              {!isCollapsed && <span className="text-sm tracking-tight">{item.name}</span>}
              
              {!isActive && !isCollapsed && (
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft size={14} className="rotate-180 text-slate-600" />
                  </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-sidebar-border mt-auto space-y-4">
        {!isCollapsed && (
            <div className="bg-secondary p-4 rounded-2xl border border-border space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Server Load</span>
                    <span className="text-emerald-500">Normal</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/50 w-1/4" />
                </div>
            </div>
        )}

        <div className="space-y-2">
            <button
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative',
                'text-slate-400 hover:bg-red-500/10 hover:text-red-500',
                isCollapsed && 'justify-center'
              )}
            >
              <LogOut size={22} className="group-hover:translate-x-0.5 transition-transform" />
              {!isCollapsed && <span className="text-sm font-bold">Cerrar Sesión</span>}
            </button>

            <button
              onClick={toggleSidebar}
              className={cn(
                'w-full h-12 flex items-center justify-center p-0 text-slate-600 hover:text-slate-300 transition-colors',
                isCollapsed ? 'rotate-180' : ''
              )}
            >
              <ChevronLeft className="transition-transform duration-500" size={20} />
            </button>
        </div>
      </div>
    </aside>
  );
};

'use client';

import { ChevronLeft, Command, LogOut, Settings, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { MODULES_CONFIG } from '@/config/modules';
import { PERMISSIONS, FEATURES } from '@/config/permissions';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useModuleContext, useTenant, useUser } from '@/providers';

export const Sidebar = () => {
  const { user, role, signOut, can, canAccessFeature } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { currentTenant, isLoading, isSuperAdmin } = useTenant();

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState) setIsCollapsed(savedState === 'true');
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Filtrar módulos según el tenant actual y el ROL del usuario
  const availableModules = useMemo(() => {
    logger.log('[Sidebar] Recalculating modules', { 
      isSuperAdmin, 
      role, 
      tenantId: currentTenant?.id, 
      activeModules: currentTenant?.active_modules || currentTenant?.activeModules 
    });

    // SuperAdmin ve TODOS los módulos (sin restricción de tenant)
    // FIX: Comentamos esto para que el SuperAdmin vea lo mismo que el Tenant (Shadowing)
    /* if (isSuperAdmin) {
      return MODULES_CONFIG.filter((module) => {
        // Solo verificar permisos granulares (RBAC User Level)
        const permissionMap: Record<string, any> = {
          'Dashboard': PERMISSIONS.CUSTOMERS_VIEW, 
          'Inventory': PERMISSIONS.INVENTORY_VIEW,
          'Users': PERMISSIONS.USERS_MANAGE,
          'Billing': PERMISSIONS.BILLING_VIEW,
          'Settings': PERMISSIONS.SETTINGS_EDIT,
          'Customers': PERMISSIONS.CUSTOMERS_VIEW,
        };

        const requiredPermission = permissionMap[module.id];
        const isAllowedByRole = !requiredPermission || can(requiredPermission);
        
        // DEBUG
        
        return isAllowedByRole;
      });
    } */

    // Usuarios normales (Dueños/Empleados)
    if (!currentTenant) {
      logger.warn('[Sidebar] No currentTenant found', { isLoading, role, isSuperAdmin });
      return [];
    }
    
    // Normalizar acceso a módulos activos (soporte para ambos nombres de propiedad)
    const activeModules = currentTenant?.active_modules || currentTenant?.activeModules || [];

    return MODULES_CONFIG.filter((module) => {
      // 1. ¿Está el módulo en la lista del Tenant? (Dashboard y Settings siempre visibles para admins)
      const isAdminOrOwner = role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
      const isAlwaysVisible = ['Dashboard', 'Settings'].includes(module.id) && isAdminOrOwner;
      
      // Si no hay tenant pero es admin, mostramos Dashboard y Settings por defecto para evitar sidebar vacío
      if (!currentTenant) return isAlwaysVisible;
      
      const isTenantActive = activeModules.includes(module.id) || isAlwaysVisible;

      // 2. Permisos (OWNER tiene todo, si el rol es OWNER saltamos el check granular por ahora para asegurar visibilidad)
      const isOwner = role === 'OWNER';
      const isAllowedByRole = isOwner || (() => {
        const permissionMap: Record<string, string> = {
          'Dashboard': PERMISSIONS.CUSTOMERS_VIEW, 
          'Inventory': PERMISSIONS.INVENTORY_VIEW,
          'Users': PERMISSIONS.USERS_MANAGE,
          'Customers': PERMISSIONS.CUSTOMERS_VIEW,
          'Sales': PERMISSIONS.SALES_VIEW,
        };
        const requiredPermission = permissionMap[module.id] as Parameters<typeof can>[0] | undefined;
        return !requiredPermission || can(requiredPermission);
      })();

      if (!isTenantActive || !isAllowedByRole) {
         logger.log(`[Sidebar] Hidden: ${module.id}`, { isTenantActive, isAllowedByRole });
      }

      return isTenantActive && isAllowedByRole;
    });
  }, [currentTenant, role, can, canAccessFeature, isSuperAdmin]);


  const moduleItems = useMemo(
    () =>
      availableModules.map((module) => {
        // Migrado de AppSidebar: Usar pathname para resaltar la ruta actual
        const isActive = pathname.startsWith(module.path);
        return (
          <Link
            key={module.id}
            href={module.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
            )}
          >
            <div
              className={cn(
                'transition-colors duration-200',
                isActive
                  ? 'text-sidebar-primary'
                  : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground',
              )}
            >
              <module.icon size={20} />
            </div>

            {!isCollapsed && (
              <>
                <span className="flex-1 truncate">{module.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-sidebar-ring shadow-[0_0_8px_hsl(var(--sidebar-ring)/0.5)]" />
                )}
              </>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border">
                {module.name}
              </div>
            )}
          </Link>
        );
      }),
    [isCollapsed, pathname, availableModules],
  );

  if (!mounted || isLoading) {
    return <aside className="w-20 h-screen bg-card border-r border-border" />;
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out z-40 overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border/50 shrink-0">
        <div
          className={cn(
            'flex items-center gap-3 overflow-hidden transition-all whitespace-nowrap',
            isCollapsed ? 'justify-center w-full' : '',
          )}
        >
          <div className="w-8 h-8 items-center justify-center rounded-lg bg-primary flex text-primary-foreground shadow-lg shadow-primary/20 flex-shrink-0">
            {isSuperAdmin ? <ShieldCheck size={18} /> : <Command size={18} />}
          </div>

          <div
            className={cn(
              'flex flex-col transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sidebar-primary leading-none">
                {currentTenant?.name || 'Dashboard'}
              </span>
              {isSuperAdmin && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-primary/20 text-primary rounded uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <span className="text-xs text-sidebar-foreground/70 font-medium mt-1">
              {currentTenant?.plan.toUpperCase() || 'Universal v1.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-4 scrollbar-thin scrollbar-thumb-muted">
        <div>
          <div
            className={cn(
              'px-3 mb-2 text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-wider transition-all duration-300 whitespace-nowrap',
              isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto',
            )}
          >
            Módulos Activos
          </div>
          <div className="space-y-1">
            {moduleItems.length > 0 ? (
              moduleItems
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                {isCollapsed ? '...' : 'No hay módulos disponibles'}
              </div>
            )}
          </div>
        </div>

        {/* Sección SuperAdmin Si corresponde */}
        {isSuperAdmin && (
          <div className="pt-2">
            <div
              className={cn(
                'px-3 mb-2 text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-wider transition-all duration-300 whitespace-nowrap',
                isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto',
              )}
            >
              Administración
            </div>
            <Link
              href="/console"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                'text-sidebar-foreground hover:bg-primary/10 hover:text-primary',
              )}
            >
              <div className="text-primary">
                <ShieldCheck size={20} />
              </div>
              {!isCollapsed && <span className="flex-1 truncate font-bold">Consola Central</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-3 border-t border-sidebar-border/50 shrink-0 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <Settings size={20} />
          <span
            className={cn(
              'ml-3 whitespace-nowrap overflow-hidden transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            Configuración
          </span>
        </Link>

        {/* Acceso rápido a Equipo (solo para admins) */}
        {!isCollapsed && !isSuperAdmin && can(PERMISSIONS.USERS_MANAGE) && (
           <Link
           href="/settings/team"
           className={cn(
             'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
             'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
           )}
         >
           <Users size={18} />
           <span className="text-xs font-medium">Gestionar Equipo</span>
         </Link>
        )}


        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
            'text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <LogOut size={20} />
          <span
            className={cn(
              'ml-3 whitespace-nowrap overflow-hidden transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            Cerrar Sesión
          </span>
        </button>

        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className={cn(
            'h-10 w-full flex items-center p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200',
            isCollapsed ? 'justify-center' : 'justify-start px-3',
          )}
        >
          <div className="flex items-center justify-center w-5 h-5 shrink-0">
            <ChevronLeft
              size={20}
              className={cn('transition-transform duration-300', isCollapsed && 'rotate-180')}
            />
          </div>
          <span
            className={cn(
              'ml-3 whitespace-nowrap overflow-hidden transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            Contraer menú
          </span>
        </Button>
      </div>
    </aside>
  );
};
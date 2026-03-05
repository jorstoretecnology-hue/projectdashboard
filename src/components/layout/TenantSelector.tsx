'use client';

import { Building2, Check, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers';

export const TenantSelector = () => {
  const { currentTenant, setCurrentTenant, isSuperAdmin, effectivePlan, tenants } = useTenant();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentTenant) {
    return null;
  }

  // Filter only active tenants for the selector
  const activeTenants = tenants.filter(t => t.isActive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors border border-transparent hover:border-border/50">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: `hsl(${currentTenant.branding.primaryColor})` }}
          >
            {currentTenant.name.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium leading-none">{currentTenant.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{effectivePlan}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 size={16} />
          Cambiar Cliente
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {activeTenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => setCurrentTenant(tenant.id)}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              currentTenant.id === tenant.id && 'bg-primary/10',
            )}
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: `hsl(${tenant.branding.primaryColor})` }}
            >
              {tenant.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{tenant.name}</span>
                {currentTenant.id === tenant.id && <Check size={14} className="text-primary" />}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {tenant.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {tenant.activeModules.length} módulos
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}

        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href="/superadmin"
                className="flex items-center gap-2 text-primary cursor-pointer"
              >
                <Crown size={16} />
                Panel SuperAdmin
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

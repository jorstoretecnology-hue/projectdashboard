'use client';

import { Menu, LayoutDashboard, Settings, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useUser } from '@/providers';
import { useModuleContext } from '@/providers/ModuleContext';

import { IconRenderer } from './Sidebar';




export function MobileSidebar() {
  const { modules } = useModuleContext();
  const { signOut } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2 h-9 w-9 p-0 hover:bg-secondary/50 rounded-xl border border-border/50"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-border/50">
        <SheetHeader className="p-6 border-b border-border/50 bg-secondary/20">
          <SheetTitle className="flex items-center gap-2 text-primary font-extrabold uppercase tracking-widest text-lg">
            <LayoutDashboard size={22} />
            Smart OS
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-80px)] justify-between py-6">
          <nav className="px-4 space-y-1 overflow-y-auto">
            <p className="px-2 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Módulos Activos</p>
            {modules.length > 0 ? (
              modules.map((module) => (
                <Link
                  key={module.key}
                  href={module.navigation[0]?.path || '#'}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group",
                    pathname.startsWith(module.navigation[0]?.path)
                      ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
                  )}
                >
                  <IconRenderer name={module.navigation[0]?.icon || 'Package'} className="h-5 w-5" />
                  <span className="font-medium text-sm flex-1">{module.navigation[0]?.label}</span>
                  <ChevronRight size={14} className={cn(
                    "opacity-0 transition-all",
                    module.navigation[0]?.path && pathname.startsWith(module.navigation[0].path) ? "opacity-100 translate-x-0" : "group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                  )} />
                </Link>
              ))
            ) : (
              <p className="px-2 py-4 text-xs text-muted-foreground/50 italic capitalize">Sin módulos activos</p>
            )}
          </nav>

          <div className="px-4 mt-auto space-y-4">
            <div className="pt-4 border-t border-border/50">
               <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all group"
              >
                <Settings size={20} />
                <span className="font-medium text-sm">Configuración</span>
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all group mt-1"
              >
                <LogOut size={20} />
                <span className="font-medium text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

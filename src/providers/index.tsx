'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import React from 'react';

import { ModuleProvider } from './ModuleContext';
import { TenantProvider } from './TenantContext';
import { AuthProvider } from './AuthContext';

import type { Session, User } from '@supabase/supabase-js';

interface ProvidersProps {
  children: ReactNode;
  initialSession?: Session | null;
  initialUser?: User | null;
}

/**
 * Proveedor principal que encapsula todos los providers de la aplicación
 */
export const Providers: React.FC<ProvidersProps> = ({ children, initialSession = null, initialUser = null }) => {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider initialSession={initialSession} initialUser={initialUser}>
        <TenantProvider>
          <ModuleProvider>{children}</ModuleProvider>
        </TenantProvider>
      </AuthProvider>
    </NextThemeProvider>
  );
};

// Re-exportar hooks para facilitar el acceso
export { useModuleContext } from './ModuleContext';
export { useTenant } from './TenantContext';
export { useUser } from './AuthContext';

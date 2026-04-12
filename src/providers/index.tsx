'use client';

import type { Session, User } from '@supabase/supabase-js';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import React from 'react';

import { AuthProvider } from './AuthContext';
import { ModuleProvider } from './ModuleContext';
import { TenantProvider } from './TenantContext';


interface ProvidersProps {
  children: ReactNode;
  initialSession?: Session | null;
  initialUser?: User | null;
}

/**
 * Proveedor principal que encapsula todos los providers de la aplicación
 */
export const Providers: React.FC<ProvidersProps> = ({ children, initialSession = null, initialUser = null }) => {
  // Parche para silenciar el error "Encountered a script tag" en desarrollo.
  // Es un falso positivo de next-themes con React 19/Next 15 por su script de flash-prevention.
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
        return;
      }
      origError.apply(console, args);
    };
  }

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

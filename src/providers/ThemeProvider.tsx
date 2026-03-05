'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Componente legacy de ThemeProvider
 * @deprecated Use el Providers centralizado de src/providers/index.tsx
 * Este archivo se mantiene temporalmente para compatibilidad
 */
const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemeProvider>
  ) : (
    <div>{children}</div>
  );
};

export default ThemeProvider;

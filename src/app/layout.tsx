import './globals.css';
import { Outfit } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { Toaster } from '@/components/ui/sonner';
import { getUser } from '@/lib/supabase/auth';
import { Providers } from '@/providers';

const outfit = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'Dashboard Universal | Sistema de Gestión',
  description: 'Sistema de gestión empresarial modular y escalable',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Obtenemos el usuario de forma segura (valida con Supabase Auth)
  const user = await getUser();

  return (
    <html lang="es" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning={true}>
      <body className={`${outfit.className} min-h-screen bg-background text-foreground antialiased`} suppressHydrationWarning={true}>
        <NuqsAdapter>
          <Providers initialUser={user}>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
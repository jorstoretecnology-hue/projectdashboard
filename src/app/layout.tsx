import './globals.css';
import { Providers } from '@/providers';
import { Toaster } from '@/components/ui/sonner';
import { getSession, getUser } from '@/lib/supabase/auth';

export const metadata = {
  title: 'Dashboard Universal | Sistema de Gestión',
  description: 'Sistema de gestión empresarial modular y escalable',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Obtenemos el usuario de forma segura (valida con Supabase Auth)
  // Eliminamos getSession del servidor para silenciar el warning de seguridad de Supabase SSR.
  const user = await getUser();

  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning={true}>
        <Providers initialUser={user}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
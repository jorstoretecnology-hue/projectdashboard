import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { getUser } from '@/lib/supabase/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  // Protección SSR: Si no hay usuario, redirigir al login
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

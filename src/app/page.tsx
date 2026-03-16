import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';

/**
 * Root Page (/)
 * Esta página actúa como el despachador principal de la aplicación.
 * Es más confiable que el middleware para redirecciones basadas en el perfil real.
 */
export default async function RootPage() {
  const user = await getUser();

  // 1. Si no hay usuario, redirigir al login
  if (!user) {
    redirect('/auth/login');
  }

  // 2. Si hay usuario, determinar su rol
  // Nota: getUser() ya trae app_metadata actualizado
  const role = (user.app_metadata?.app_role || 'VIEWER').toUpperCase();

  if (role === 'SUPER_ADMIN') {
    redirect('/console/dashboard');
  }

  // 3. Usuario normal con tenant asociado
  // En el futuro, aquí podríamos verificar si tiene tenant_id, 
  // si no tiene, también mandarlo a onboarding aunque esté logueado.
  redirect('/dashboard');
}

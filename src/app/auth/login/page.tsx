'use client';

import { Loader2, Eye, EyeOff, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const router = useRouter();
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const token = searchParams?.get('token');
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldown) {
      toast.error('Espera unos segundos antes de reintentar.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 2000);
        return;
      }

      if (data.user) {
        toast.success('Sesión iniciada correctamente');

        if (token) {
          router.push(`/auth/invite?token=${token}`);
        } else {
          router.push('/post-auth');
        }
        router.refresh();
      }
    } catch {
      toast.error('Error inesperado al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signOut();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      toast.error('Error al conectar con Google');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/login-bg.png"
          alt="Premium Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-background/90" />
      </div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 glass-card rounded-2xl animate-float">
              <LayoutDashboard className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Smart Business <span className="text-primary italic">OS</span>
              </h1>
              <p className="text-muted-foreground text-lg font-medium">
                Acceso a tu consola de control empresarial
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="glass-card rounded-3xl p-8 sm:p-10 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,1)]">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-300 ml-1">
                  Email Profesional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@rivera.com"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-primary/50 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-300">
                    Contraseña
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-primary hover:text-white transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-primary/50 pr-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-[0_8px_16px_-4px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading || cooldown}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : cooldown ? (
                  'Espera unos segundos…'
                ) : (
                  'Entrar al Dashboard'
                )}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0b0f19] px-4 text-slate-500 font-bold tracking-widest">
                  o accede con
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all"
              onClick={handleGoogleLogin}
              aria-label="Iniciar sesión con Google"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 488 512" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Continuar con Google
            </Button>
          </div>

          {/* Footer Info */}
          <div className="flex flex-col items-center space-y-6">
            <p className="text-muted-foreground text-sm">
              ¿No tienes una cuenta?{' '}
              <Link
                href={`/auth/register${token ? `?token=${token}` : ''}`}
                className="text-white font-bold hover:text-primary transition-colors underline decoration-primary/50 underline-offset-4"
              >
                Crea una ahora
              </Link>
            </p>

            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Conexión segura SSL (AES-256)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

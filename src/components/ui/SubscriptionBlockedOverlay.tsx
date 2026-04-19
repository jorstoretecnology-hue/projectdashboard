'use client';

import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface Props {
  title?: string;
  message?: string;
  type?: 'blocked' | 'warning';
  onAction?: () => void;
  actionText?: string;
}

export function SubscriptionBlockedOverlay({ 
  title = "Acceso Restringido", 
  message = "Tu suscripción no incluye acceso a este módulo o hay un pago pendiente.", 
  type = 'blocked',
  onAction,
  actionText = "Ir a Facturación"
}: Props) {
  const router = useRouter();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/billing');
    }
  };

  const isWarning = type === 'warning';

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-md rounded-xl border ${isWarning ? 'border-amber-500/50' : 'border-destructive/50'}`}>
      <div className={`p-4 rounded-full mb-4 ${isWarning ? 'bg-amber-500/10 text-amber-500' : 'bg-destructive/10 text-destructive'}`}>
        {isWarning ? <AlertTriangle className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
      </div>
      <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {message}
      </p>
      <Button 
        onClick={handleAction} 
        variant={isWarning ? "default" : "destructive"}
        size="lg"
        className="font-semibold shadow-lg transition-transform hover:scale-105"
      >
        {actionText}
      </Button>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { SubscriptionStatus } from '@/providers/TenantContext';

interface Props {
  status: SubscriptionStatus;
}

export function SubscriptionBlockedOverlay({ status }: Props) {
  const router = useRouter();

  const message =
    status === 'past_due'
      ? 'Tu suscripción tiene un pago pendiente. Regulariza tu cuenta para continuar.'
      : 'Tu suscripción está suspendida. Contacta a soporte.';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        borderRadius: '0.75rem',
      }}
    >
      <p style={{ color: 'white', textAlign: 'center', maxWidth: '320px' }}>
        {message}
      </p>
      <Button onClick={() => router.push('/billing')}>Ir a Facturación</Button>
    </div>
  );
}

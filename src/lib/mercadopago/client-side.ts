/**
 * MercadoPago Client-Side Helper
 * Carga el SDK de MercadoPago dinámicamente si es necesario
 * y provee funciones para instanciar el Checkout.
 */

interface MercadoPagoInstance {
  checkout: (options: {
    preference: { id: string };
    autoOpen: boolean;
  }) => unknown;
}

interface MercadoPagoConstructor {
  new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance;
}

declare global {
  interface Window {
    MercadoPago: MercadoPagoConstructor;
  }
}

let mpInstance: MercadoPagoInstance | null = null;

export const loadMercadoPago = async (publicKey: string) => {
  if (mpInstance) return mpInstance;

  if (typeof window === 'undefined') return null;

  // Cargar SDK script si no existe
  if (!window.MercadoPago) {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    const loadPromise = new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });

    document.body.appendChild(script);
    await loadPromise;
  }

  mpInstance = new window.MercadoPago(publicKey, {
    locale: 'es-CO' // O detectar del tenant
  });

  return mpInstance;
};

/**
 * Abre el Checkout Pro de MercadoPago
 */
export const openCheckout = async (preferenceId: string) => {
  if (!mpInstance) throw new Error("MercadoPago no ha sido inicializado");

  const checkout = mpInstance.checkout({
    preference: {
      id: preferenceId
    },
    autoOpen: true
  });
  
  return checkout;
};

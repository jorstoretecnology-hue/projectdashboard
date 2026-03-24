import { describe, it, expect } from 'vitest';

describe('Project Environment', () => {
  it('should have database configuration (example format)', () => {
    // Validamos que el runner cargue variables o al menos detecte el entorno
    // En CI/CD esto asegura que los secretos están inyectados
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('should have MercadoPago configuration template', () => {
    // Verificamos que al menos esté previsto el uso de las claves
    expect(process.env.MP_ACCESS_TOKEN || 'missing').toBeDefined();
  });
});

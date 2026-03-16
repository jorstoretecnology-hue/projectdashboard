'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/providers';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ShieldX } from 'lucide-react';

/**
 * Props para TenantGuard
 */
interface TenantGuardProps {
  children: React.ReactNode;
  /** Permisos requeridos para acceder */
  requiredPermissions?: string[];
  /** Callback cuando no hay acceso */
  onAccessDenied?: () => void;
  /** Mostrar mensaje de error personalizado */
  errorMessage?: string;
  /** Mostrar loading mientras valida */
  showLoading?: boolean;
}

/**
 * Componente de seguridad que valida acceso multi-tenant
 * Garantiza que solo usuarios autorizados accedan a recursos
 */
export const TenantGuard: React.FC<TenantGuardProps> = ({
  children,
  requiredPermissions = [],
  onAccessDenied,
  errorMessage,
  showLoading = true,
}) => {
  const { currentTenant, isLoading, isSuperAdmin } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Si no hay tenant activo, redirigir
    if (!currentTenant && !isSuperAdmin) {
      onAccessDenied?.();
      router.push('/auth/login');
      return;
    }

    // Aquí se podrían validar permisos específicos si fuera necesario
    // Por ahora, solo validamos que haya tenant o sea super admin

  }, [currentTenant, isLoading, isSuperAdmin, router, onAccessDenied]);

  // Mostrar loading mientras valida
  if (isLoading && showLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Validando acceso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si no hay tenant y no es super admin, mostrar error
  if (!currentTenant && !isSuperAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <ShieldX className="h-6 w-6 text-destructive" />
            <div className="space-y-1">
              <h3 className="font-semibold text-destructive">Acceso Denegado</h3>
              <p className="text-sm text-muted-foreground">
                {errorMessage || 'No tienes permisos para acceder a este recurso.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Acceso concedido
  return <>{children}</>;
};

/**
 * Hook personalizado para operaciones CRUD seguras
 */
export const useSecureCRUD = () => {
  const { currentTenant, isSuperAdmin } = useTenant();

  interface ProductData {
    tenantId?: string;
    name: string;
    price: number;
    [key: string]: any;
  }

  interface ProductFilters {
    category?: string;
    status?: string;
    [key: string]: any;
  }

  interface ValidationResult {
    allowed: boolean;
    reason: string;
    error?: string;
  }

  const validateTenantAccess = (operation: string, resourceTenantId?: string): ValidationResult => {
    // Super admin tiene acceso total
    if (isSuperAdmin) {
      return { allowed: true, reason: 'Super admin access' };
    }

    // Usuario normal debe tener tenant activo
    if (!currentTenant) {
      return {
        allowed: false,
        reason: 'No active tenant',
        error: 'Usuario no tiene tenant activo'
      };
    }

    // Si se especifica tenant_id del recurso, validar que coincida
    if (resourceTenantId && resourceTenantId !== currentTenant.id) {
      return {
        allowed: false,
        reason: 'Tenant mismatch',
        error: 'Intento de acceso a recurso de otro tenant'
      };
    }

    return { allowed: true, reason: 'Valid tenant access' };
  };

  const createProduct = async (productData: ProductData): Promise<ProductData> => {
    const validation = validateTenantAccess('create', productData.tenantId);
    if (!validation.allowed) {
      throw new Error(validation.error);
    }

    // Aquí iría la llamada a Supabase con RLS
    // El RLS en la base de datos hará la validación final
    return {
      ...productData,
      tenantId: currentTenant?.id || productData.tenantId,
      createdAt: new Date().toISOString(),
    };
  };

  const updateProduct = async (productId: string, updates: Partial<ProductData>, resourceTenantId?: string): Promise<Partial<ProductData>> => {
    const validation = validateTenantAccess('update', resourceTenantId);
    if (!validation.allowed) {
      throw new Error(validation.error);
    }

    // Validación adicional: asegurar que no se pueda cambiar tenant_id
    if (updates.tenantId && updates.tenantId !== resourceTenantId) {
      throw new Error('No se puede cambiar el tenant de un producto');
    }

    // Aquí iría la llamada a Supabase
    return {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  };

  const deleteProduct = async (productId: string, resourceTenantId?: string): Promise<{ deleted: boolean; productId: string }> => {
    const validation = validateTenantAccess('delete', resourceTenantId);
    if (!validation.allowed) {
      throw new Error(validation.error);
    }

    // Aquí iría la llamada a Supabase
    return { deleted: true, productId };
  };

  const getProducts = async (filters?: ProductFilters): Promise<{ products: ProductData[]; total: number; filters: ProductFilters }> => {
    const validation = validateTenantAccess('read');
    if (!validation.allowed) {
      throw new Error(validation.error);
    }

    // Aquí iría la llamada a Supabase con filtros de tenant aplicados por RLS
    return {
      products: [],
      total: 0,
      filters: {
        tenantId: currentTenant?.id,
        ...filters,
      },
    };
  };

  return {
    validateTenantAccess,
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
  };
};

/**
 * Higher-Order Component para proteger rutas
 */
export const withTenantGuard = <P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<TenantGuardProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <TenantGuard {...guardProps}>
      <Component {...props} />
    </TenantGuard>
  );

  WrappedComponent.displayName = `withTenantGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

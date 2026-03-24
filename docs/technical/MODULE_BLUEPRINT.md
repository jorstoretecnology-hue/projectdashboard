# Blueprint de Módulo (Patrón Inventory)

Este documento define la estructura y el flujo de implementación estándar para todos los módulos de "ProyectDashboard". El módulo `Inventory` sirve como la implementación de referencia (Golden Master).

## 1. Estructura de Carpetas

Todo módulo debe seguir estrictamente esta jerarquía. No se permite código de negocio fuera de `src/modules`.

```bash
src/
├── modules/
│   └── [module-id]/          # Identificador único (ej: inventory, crm)
│       ├── actions.ts        # ✅ CONTRATO: Permisos, Zod Schemas y Constantes de UI
│       ├── db/
│       │   └── schema.sql    # ✅ DATOS: Definición SQL y RLS (Documentation Only)
│       └── services/
│           └── [module].service.ts # ✅ LÓGICA: Supabase Client, Mappers y API Calls
├── components/
│   └── [module-id]/          # ✅ UI: Componentes tontos y Dialogs específicos
│       ├── [Module]Card.tsx
│       ├── [Module]Form.tsx  # React Hook Form + Zod (Reutilizable)
│       └── [Module]CreateDialog.tsx
└── app/
    └── (app)/
        └── [module-id]/
            └── page.tsx      # ✅ ORQUESTADOR: Estado, Efectos y Layout
```

## 2. Flujo de Desarrollo (Paso a Paso)

### Fase A: Contratos (Frontend First)
1.  **Definir `actions.ts`**:
    *   Crear objeto `ACTIONS` con claves, etiquetas y permisos requeridos.
    *   Definir Schema Zod (`z.object`) para validación de datos.
    *   Exportar tipos TypeScript inferidos (`z.infer`).

### Fase B: UI Desacoplada
2.  **Componentes de Presentación**:
    *   Crear `Card`, `Header`, `Toolbar` puros (props in, events out).
    *   No conectar a store ni backend.
3.  **Formulario**:
    *   Crear `[Module]Form.tsx` usando `react-hook-form` y `zodResolver`.
    *   Debe recibir `onSubmit` y `defaultValues` como props.
4.  **Dialogs**:
    *   Crear wrappers que conecten el botón/acción con el formulario.
    *   Usar `toast` para feedback optimista/mock.

### Fase C: Backend & Integración
5.  **Schema SQL (`db/schema.sql`)**:
    *   Tabla con `tenant_id` obligatorio.
    *   **RLS Policies** obligatorias para aislamiento por tenant.
6.  **Service (`services/[module].service.ts`)**:
    *   Clase Singleton (ej: `inventoryService`).
    *   Métodos `list`, `create`, `update`, `delete`.
    *   **Mapper Explícito**: `mapToDomain(dbItem)` para desacoplar DB de Frontend.
7.  **Conexión en Page (`page.tsx`)**:
    *   Reemplazar mocks con `useEffect` + `Service.list()`.
    *   Manejar estados `isLoading`, `error`, `empty`.

## 3. Reglas de Oro

1.  **Aislamiento Multi-Tenant**: Nunca hacer una query sin `tenant_id` (en backend) o sin verificar `currentTenant` (en frontend).
2.  **Soberanía de Datos**: Un módulo no importa modelos de otro módulo. Usa IDs o Event Bus.
3.  **UI Agnóstica**: Los formularios no saben de backend. Reciben una función `onSubmit`.
4.  **Guard Clauses**: Toda página debe validar `isModuleActive` antes de renderizar.
5.  **Tipado de Respuestas**: Los Dialogs deben emitir tipos de Dominio (ej: `Customer`), no FormValues (ej: `CustomerFormValues`) en `onSuccess`.

## 4. Patrón de Quotas (Quota UX Pattern)

El gobierno de límites (Quotas) es responsabilidad exclusiva del Backend (`QuotaEngine`). La UI reacciona a los errores semánticos.

**Regla**:
1.  **NO** deshabilitar botones en base a quotas (el frontend no calcula límites).
2.  Los Dialogs de Creación deben usar siempre el hook `useQuotaError()`.
3.  Si el Service lanza error `QUOTA_EXCEEDED`, se debe interrumpir el flujo normal e invocar `handleQuotaError(error)`.
4.  Renderizar `<QuotaExceededDialog />` condicionado al estado del hook.

```tsx
// Ejemplo Implementation Pattern
const { quotaResource, handleQuotaError, resetQuotaError } = useQuotaError()

const handleSubmit = async (data) => {
  resetQuotaError()
  try {
    await service.create(data)
  } catch (error) {
    if (handleQuotaError(error)) return // ✨ Hijack del flujo
    toast.error("Error genérico")
  }
}
```

## 5. Upgrade Flow (Payment Provider Agnostic)

El sistema implementa un flujo de actualización de plan desacoplado de la pasarela de pagos mediante el patrón **Adapter**. Esto permite validar la arquitectura de permisos y cuotas antes de integrar proveedores financieros, y facilita la migración entre proveedores (Stripe → MercadoPago → Wompi) sin tocar la UI.

### Principios
1.  **Event Driven**: El cambio de plan es un evento de dominio que dispara actualizaciones en `QuotaEngine` y `PermissionEngine`.
2.  **Simulation State**: El estado del plan se gestiona temporalmente en memoria (`usePlanUpgrade`) para demos y pruebas, sin persistir en DB.
3.  **Billing Agnostic**: La UI de Billing no conoce a Stripe ni MercadoPago. Solo conoce `PlanType` y `Limits`.
4.  **Adapter Pattern**: Un contrato estable (`BillingAdapter`) abstrae la lógica de pago. El mock adapter valida la arquitectura completa.

### Arquitectura del Adapter
```typescript
// Contrato de dominio
interface BillingAdapter {
  upgradePlan(params: {
    tenantId: string;
    currentPlan: PlanType;
    targetPlan: PlanType;
  }): Promise<UpgradeResult>;
}

// Implementación mock (desarrollo/demos)
class MockBillingAdapter implements BillingAdapter {
  async upgradePlan(params) {
    // Simula latencia y validaciones básicas
    await delay(800);
    return { success: true, plan: params.targetPlan };
  }
}

// Resolución centralizada
function getBillingAdapter(): BillingAdapter {
  // Futuro: return new WompiAdapter() en producción
  return new MockBillingAdapter();
}
```

### Flujo de UI
1.  Usuario selecciona "Actualizar" en `PlanCard`.
2.  Se abre `UpgradePlanDialog` (Confirmación explícita: "Este cambio es solo una simulación").
3.  Al confirmar, se invoca `upgradePlan(targetPlan)` → Adapter → Contexto.
4.  **Efecto Cascada**:
    *   Se actualiza el `effectivePlan` en el contexto local.
    *   `CurrentPlanBanner` refleja el nuevo badge.
    *   `QuotaOverview` recalcula las barras de progreso con los nuevos límites.
    *   `usePermission` re-evalúa permisos automáticamente.
    *   Módulos previamente bloqueados se desbloquean visualmente.
    *   `TenantSelector` muestra el plan efectivo.

### Beneficios del Patrón
- **Zero Refactor**: Cambiar de pasarela requiere solo cambiar `getBillingAdapter()`.
- **Testable**: El mock adapter permite tests E2E sin pagos reales.
- **Sales Ready**: Demos comerciales sin dependencias externas.
- **Arquitectura Validada**: La simulación prueba el flujo completo antes de cobrar.

## 6. Persistence Layer (Real Plan Storage)

El sistema incluye persistencia real del plan del tenant en base de datos, manteniendo la separación entre dominio e infraestructura.

### Arquitectura
```typescript
// Servicio de dominio (sin conocimiento de DB)
class TenantService {
  async updatePlan(tenantId: string, plan: PlanType): Promise<void> {
    // Operación de dominio puro
  }
}

// Contexto actualiza DB automáticamente
const updateTenant = async (tenantId, updates) => {
  if (updates.plan) {
    await tenantService.updatePlan(tenantId, updates.plan);
  }
  // Update local state
};
```

### Base de Datos
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    -- ... otros campos
);
```

### Flujo de Persistencia
1.  Usuario confirma upgrade → BillingAdapter.success
2.  `updatePlan()` → TenantService → DB
3.  TenantContext actualiza estado local
4.  Simulation se limpia automáticamente
5.  EffectivePlan ahora usa plan persistido

### Beneficios
- **Real SaaS**: Plan sobrevive a sesiones/recargas
- **Infra Separada**: Servicio de dominio no conoce Supabase
- **Resiliente**: Fallback a estado local si DB falla
- **Reversible**: Sin romper simulación existente
```

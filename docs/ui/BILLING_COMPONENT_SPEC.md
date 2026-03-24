# 🎨 Especificación de Componentes: Módulo Billing
> **Versión**: 1.0.0 | **Fecha**: 2026-03-22 | **Autor**: Antigravity (UX/UI Lead)
> **Basado en**: MODULE_BLUEPRINT.md § 5 (Upgrade Flow) + Shadcn/UI Design System

---

## Principios de Diseño (Billing Module)

1. **Claridad financiera**: Los estados de pago deben ser inequívocos. Use colores semánticos (`emerald`, `amber`, `red`) no solo íconos.
2. **Confianza progresiva**: El flujo de upgrade debe tranquilizar al usuario antes de redirigir a un sitio externo.
3. **Feedback inmediato**: Toda acción con latencia de red debe mostrar estado de carga (`Skeleton` o `Button` con spinner).
4. **Patron Guard Clause (Blueprint §3)**: La página de billing DEBE verificar `isModuleActive('billing')` antes de renderizar.

---

## 1. `CurrentPlanBanner` — Estado Actual

**Ubicación**: `src/components/billing/CurrentPlanBanner.tsx`
**Uso**: Panel lateral de la página `/billing`

### Estructura Visual (ASCII Wireframe)
```
┌──────────────────────────┐
│ 👑 Plan Profesional       │  ← CardTitle + icono por plan
│ ─────────────────────── │
│  Estado: ● Activo         │  ← Badge emerald "Activo" / amber "Trial" / red "Vencido"
│  Próximo cobro: 22 abr   │  ← Fecha formateada con `formatDate()`
│  $129,000 COP / mes       │  ← Precio con `formatCurrency()`
│                           │
│  [Gestionar suscripción]  │  ← Button variant="outline" size="sm"
└──────────────────────────┘
```

### Props Interface
```typescript
interface CurrentPlanBannerProps {
  planInfo: {
    name: string;
    price: string;
    features: string[];
    maxUsers: number;
    maxModules: number;
  };
  subscription?: {
    status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended';
    current_period_end: string; // ISO date
    billing_cycle: 'monthly' | 'yearly';
  };
}
```

### Variantes de Estado (Badge)
| Estado DB        | Color Badge    | Texto       | Ícono       |
|------------------|----------------|-------------|-------------|
| `active`         | `bg-emerald-500` | Activo    | `CheckCircle` |
| `trialing`       | `bg-blue-500`  | Trial       | `Clock`     |
| `past_due`       | `bg-amber-500` | Pago Pendiente | `AlertTriangle` |
| `cancelled`      | `bg-red-500`   | Cancelado   | `XCircle`   |
| `suspended`      | `bg-slate-400` | Suspendido  | `Pause`     |

---

## 2. `PlanCard` — Selección de Plan

**Ubicación**: `src/components/billing/PlanCard.tsx`
**Uso**: Grid de 4 columnas en `/billing`

### Estructura Visual (ASCII Wireframe)
```
┌── ← borde-2 border-primary si isCurrent ──┐
│           [Más Popular]  ← Badge -top-3    │
│                                           │
│  Profesional         👑                   │
│  ─────────────────────────────────────── │
│  $129,000                                 │
│  / mes                                    │
│  Hasta 10 usuarios • 11 módulos           │
│                                           │
│  ✓ Inventario avanzado                    │
│  ✓ CRM Clientes                           │
│  ✓ Módulo de Ventas                       │
│  ✓ Compras y Proveedores                  │
│  ✓ Órdenes de Trabajo                     │
│                                           │
│  [  Actualizar Plan  ]  ← btn w-full      │
└───────────────────────────────────────────┘
```

### Comportamiento del Botón CTA
- **Plan actual** → `disabled`, `variant="outline"`, texto: `"✓ Plan Actual"`
- **Plan inferior** → `variant="outline"`, texto: `"Cambiar a [Nombre]"` (downgrade)
- **Plan superior** → `variant="default"`, texto: `"Actualizar Plan"`
- **Plan Enterprise** → `variant="default"`, texto: `"Contactar Sales"`

---

## 3. `UpgradePlanDialog` — Confirmación de Pago ⭐ CRÍTICO

**Ubicación**: `src/components/billing/UpgradePlanDialog.tsx`
**Uso**: Modal al hacer clic en "Actualizar Plan"

### Estructura Visual
```
┌─────────────────────────────────────────────┐
│  Actualizar a Plan Profesional              │
│  ─────────────────────────────────────────  │
│  Estás a punto de mejorar tu suscripción.  │
│                                             │
│  ┌──────────┐    →    ┌──────────────────┐ │
│  │ Starter  │         │  Profesional 👑  │ │
│  │ $49,000  │         │  $129,000/mes    │ │
│  └──────────┘         └──────────────────┘ │
│                                             │
│  Nuevas características:                   │
│  ✓ Hasta 10 usuarios                       │
│  ✓ 3 sedes                                 │
│  ✓ Órdenes de Trabajo                      │
│                                             │
│  ⚠ Serás redirigido a MercadoPago para     │
│    completar el pago de forma segura.       │
│                                             │
│  [  Cancelar  ]   [  Ir a MercadoPago →  ] │
│                    ↑ btn default + Loader   │
└─────────────────────────────────────────────┘
```

### Estados del Botón de Confirmación
```tsx
// Estado idle
<Button onClick={handleUpgrade}>
  <ExternalLink className="mr-2 h-4 w-4" />
  Ir a MercadoPago
</Button>

// Estado loading (mientras se genera la preferencia)
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Preparando pago...
</Button>
```

### Regla de Micro-copy
- ❌ NO usar: `"Confirmar Upgrade (Simulado)"`
- ✅ USAR: `"Ir a MercadoPago"` + ícono `ExternalLink`
- ✅ INCLUIR: Nota de seguridad `"Serás redirigido a MercadoPago para completar el pago de forma segura."`

---

## 4. `PaymentHistory` — Historial de Transacciones (NUEVO)

**Ubicación**: `src/components/billing/PaymentHistory.tsx`
**Uso**: Sección inferior de `/billing`
**Fuente de datos**: Hook `use-payments.ts` → tabla `public.payments`

### Estructura Visual
```
┌──────────────────────────────────────────────────────┐
│  Historial de Pagos                                  │
│  ──────────────────────────────────────────────────  │
│  Fecha         Descripción     Monto       Estado    │
│  ──────────────────────────────────────────────────  │
│  22 mar 2026   Plan Pro (abr)  $129,000   ● Pagado   │
│  22 feb 2026   Plan Pro (mar)  $129,000   ● Pagado   │
│  22 ene 2026   Plan Pro (feb)  $129,000   ❌ Fallido  │
│  ──────────────────────────────────────────────────  │
│                                    [Ver todos →]     │
└──────────────────────────────────────────────────────┘
```

### Badge por Estado de Pago
| Status DB   | Variante Badge  | Texto    |
|-------------|-----------------|----------|
| `paid`      | `bg-emerald-100 text-emerald-800` | Pagado |
| `pending`   | `bg-amber-100 text-amber-800`     | Pendiente |
| `failed`    | `bg-red-100 text-red-800`         | Fallido |
| `refunded`  | `bg-blue-100 text-blue-800`       | Reembolsado |

### Empty State
```
Sin historial de pagos aún.
Tu primer pago aparecerá aquí una vez aprobado.
[Ícono: Receipt]
```

---

## 5. `PaymentStatusAlert` — Feedback de Retorno (NUEVO)

**Ubicación**: Inline en `src/app/(app)/billing/page.tsx`
**Trigger**: Parámetros URL `?status=success|failure|pending`

### Variantes
```tsx
// ?status=success
<Alert variant="success" className="border-emerald-500/50 bg-emerald-500/10">
  <CheckCircle className="h-5 w-5 text-emerald-600" />
  <AlertTitle>¡Pago exitoso! 🎉</AlertTitle>
  <AlertDescription>
    Tu plan ha sido actualizado. Los nuevos límites ya están activos.
  </AlertDescription>
</Alert>

// ?status=failure
<Alert variant="destructive">
  <XCircle className="h-5 w-5" />
  <AlertTitle>Pago rechazado</AlertTitle>
  <AlertDescription>
    No pudimos procesar tu pago. Revisa tus datos y vuelve a intentar.
    <Button variant="link" className="h-auto p-0 ml-1">Intentar de nuevo</Button>
  </AlertDescription>
</Alert>

// ?status=pending
<Alert className="border-amber-500/50 bg-amber-500/10">
  <Clock className="h-5 w-5 text-amber-600" />
  <AlertTitle>Pago en proceso</AlertTitle>
  <AlertDescription>
    Tu pago está siendo verificado. Te notificaremos al confirmar.
  </AlertDescription>
</Alert>
```

---

## 6. `QuotaUsageCard` — Uso de Cuotas

**Ubicación**: `src/components/billing/QuotaUsageCard.tsx`

### Regla de Color de Barra de Progreso
| Uso (%)      | Color                  |
|--------------|------------------------|
| 0–60%        | `bg-primary` (azul)    |
| 61–85%       | `bg-amber-500`         |
| 86–100%+     | `bg-red-500`           |

---

## 7. Flujo de Navegación (User Journey)

```
/billing (carga)
    │
    ├─ [Guard] isModuleActive('billing') = false → Card "Sin acceso"
    │
    └─ [Guard] true → Render principal
           │
           ├─ CurrentPlanBanner (estado de suscripción)
           ├─ QuotaOverview (barras de uso)
           ├─ PaymentStatusAlert (si hay ?status en URL)
           ├─ Grid de PlanCards
           ├─ PaymentHistory (últimas 5 transacciones)
           └─ Card "¿Necesitas un plan personalizado?"
                   │
                   └─ [Clic "Actualizar Plan"] → UpgradePlanDialog
                              │
                              ├─ [Confirmar] → createUpgradePreferenceAction()
                              │       └─ loadMercadoPago() → openCheckout()
                              │               └─ Redirect externo → MP
                              │                       └─ Callback → /billing?status=*
                              └─ [Cancelar] → cierra dialog
```

---

## 8. Tokens de Diseño Usados

| Token               | Uso en Billing                     |
|---------------------|------------------------------------|
| `text-primary`      | Plan destacado, precios            |
| `text-muted-foreground` | Textos secundarios, ayudas     |
| `border-primary`    | Card del plan actual               |
| `bg-emerald-500`    | Pagado, Activo                     |
| `bg-amber-500`      | Pendiente, Advertencia             |
| `bg-red-500`        | Fallido, Error                     |
| `ring-primary/20`   | Resaltado del plan actual          |

---

## Checklist de Accesibilidad (a11y)

- [ ] `Dialog` tiene `aria-labelledby` y `aria-describedby`
- [ ] Botón de carga tiene `aria-busy="true"` y `aria-label` descriptivo
- [ ] Badges de estado tienen suficiente contraste (mínimo 4.5:1)
- [ ] Tabla de historial tiene `<caption>` y headers `<th scope="col">`
- [ ] Alertas de retorno son `role="alert"` para lectores de pantalla

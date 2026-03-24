# 🎨 Sistema de Diseño — Smart Business OS
> **Versión**: 1.0.0 | **Fecha**: 2026-03-22 | **Autor**: Antigravity (UX/UI Lead)
> **Stack**: Shadcn/UI + Tailwind CSS + CSS Variables

---

## Principios Globales de Diseño

| Principio          | Descripción |
|--------------------|-------------|
| **Clarity First**  | La información de negocio debe ser legible sin esfuerzo. |
| **Semantic Color** | El color comunica significado (verde=ok, ámbar=advertencia, rojo=error). |
| **Trust by Design**| Las acciones financieras y destructivas requieren un paso de confirmación. |
| **Guard UX**       | Toda página debe tener estados de bloqueo claros para módulos inactivos. |
| **Responsive**     | Mobile-first. Los grids colapsan a 1 columna en <640px. |

---

## Paleta de Colores Semánticos

```css
/* Paleta base (via CSS Variables en globals.css) */
--primary: hsl(221, 83%, 53%);       /* Azul corporativo */
--muted: hsl(210, 40%, 96%);          /* Fondo sutil */
--muted-foreground: hsl(215, 16%, 47%);

/* Colores semánticos (Tailwind) */
/* ✅ Éxito / Activo */   bg-emerald-500, text-emerald-700, bg-emerald-100
/* ⚠️ Advertencia */      bg-amber-500,   text-amber-700,   bg-amber-100
/* ❌ Error / Crítico */   bg-red-500,     text-red-700,     bg-red-100
/* ℹ️ Información */       bg-blue-500,    text-blue-700,    bg-blue-100
/* ⏸️ Inactivo */          bg-slate-400,   text-slate-600,   bg-slate-100
```

---

## Tokens de Tipografía

| Uso                    | Clase Tailwind                     |
|------------------------|------------------------------------|
| Título de página (H1)  | `text-4xl font-bold tracking-tight` |
| Título de sección (H2) | `text-2xl font-bold tracking-tight` |
| Título de card (H3)    | `text-lg font-semibold`            |
| Cuerpo                 | `text-sm text-muted-foreground`    |
| Label de formulario    | `text-sm font-medium`              |
| Precio destacado       | `text-4xl font-bold tracking-tight`|
| Metadata / helper      | `text-xs text-muted-foreground`    |

---

## Componentes Shadcn/UI — Guía de Uso

### Badge
```tsx
// ✅ Estado positivo
<Badge className="bg-emerald-500 hover:bg-emerald-600">Activo</Badge>

// ⚠️ Advertencia
<Badge className="bg-amber-500 hover:bg-amber-600">Pendiente</Badge>

// ❌ Error
<Badge variant="destructive">Cancelado</Badge>

// Info (plan, módulo)
<Badge className="bg-primary hover:bg-primary/90">Plan Pro</Badge>
```

### Button — Jerarquía de Acciones
| Jerarquía      | Variante          | Uso                               |
|----------------|-------------------|-----------------------------------|
| Primaria       | `default`         | CTA principal (Guardar, Confirmar) |
| Secundaria     | `outline`         | Acciones alternativas             |
| Destructiva    | `destructive`     | Eliminar, Cancelar suscripción    |
| Link           | `link`            | Navegación contextual             |
| Ghost          | `ghost`           | Acciones de tabla, menús          |

### Alert — Feedback Contextual
```tsx
// Siempre usar los 4 subcomponentes para accesibilidad:
<Alert variant="[default|destructive]">
  <IconComponent className="h-5 w-5" />
  <AlertTitle>Título claro</AlertTitle>
  <AlertDescription>Descripción accionable</AlertDescription>
</Alert>
```

### Card — Contenedor de Módulo
```tsx
// Patrón estándar para módulos
<Card>
  <CardHeader>
    <CardTitle>Título del módulo</CardTitle>
    <CardDescription>Descripción breve</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
  <CardFooter className="flex justify-between">
    {/* Acciones pie de card */}
  </CardFooter>
</Card>
```

---

## Patrones de Estado de UI

### Empty State
```tsx
// Patrón estándar para listas vacías
<div className="text-center py-12">
  <IconComponent className="h-12 w-12 mx-auto text-muted-foreground/50" />
  <h3 className="mt-4 text-lg font-semibold">Sin [recurso] aún</h3>
  <p className="text-sm text-muted-foreground mt-2">
    [Descripción accionable: qué puede hacer el usuario]
  </p>
  <Button className="mt-4" variant="outline">
    [CTA: Crear primero]
  </Button>
</div>
```

### Loading State
```tsx
// Skeleton para cards
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {[...Array(4)].map((_, i) => (
    <Card key={i}>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  ))}
</div>
```

### Error State
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-5 w-5" />
  <AlertTitle>Error al cargar datos</AlertTitle>
  <AlertDescription>
    {errorMessage}
    <Button variant="link" className="h-auto p-0 ml-1" onClick={retry}>
      Reintentar
    </Button>
  </AlertDescription>
</Alert>
```

### Module Guard (Patrón Blueprint §3)
```tsx
// Bloqueo estándar para módulos inactivos
if (!isModuleActive('billing')) {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockIcon className="h-5 w-5 text-muted-foreground" />
            Módulo no disponible
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No tienes acceso a este módulo. Contacta a tu administrador
          o considera actualizar tu plan.
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Layout de Página Estándar

```tsx
// Patrón estándar para todas las páginas de módulo
<div className="min-h-screen bg-background">
  <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    {/* 1. Header de página */}
    <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight">Nombre del Módulo</h1>
      <p className="text-lg text-muted-foreground">
        Descripción breve del propósito.
      </p>
    </div>

    {/* 2. Alertas contextuales (si aplica) */}

    {/* 3. Grid de métricas / banner principal */}
    <div className="grid gap-6 lg:grid-cols-3">
      {/* col-span-1: Panel de estado */}
      {/* col-span-2: Métricas / datos secundarios */}
    </div>

    {/* 4. Sección principal */}
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Sección</h2>
      {/* Contenido */}
    </div>

    {/* 5. Footer / CTA secundario (opcional) */}
  </div>
</div>
```

---

## Mapeo de Módulos → Íconos (Lucide)

| Módulo        | Ícono Lucide      |
|---------------|-------------------|
| Dashboard     | `LayoutDashboard` |
| Inventario    | `Package`         |
| Clientes      | `Users`           |
| Ventas        | `ShoppingCart`    |
| Compras       | `TruckIcon`       |
| Facturación   | `CreditCard`      |
| Reportes      | `BarChart2`       |
| Configuración | `Settings`        |
| Órdenes Trab. | `Wrench`          |
| Vehículos     | `Car`             |
| Usuarios      | `UserCog`         |

---

## Responsive Breakpoints (Tailwind)

| Prefijo | Min-width | Uso común                         |
|---------|-----------|-----------------------------------|
| (base)  | 0px       | Mobile: 1 columna                 |
| `sm:`   | 640px     | Tablet pequeña: 2 columnas        |
| `md:`   | 768px     | Tablet: grids de 2-3 col          |
| `lg:`   | 1024px    | Desktop: layout completo          |
| `xl:`   | 1280px    | Pantallas grandes: max-w-7xl      |

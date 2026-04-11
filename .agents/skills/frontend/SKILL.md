---
name: frontend-ux
description: >
  Diseño e implementación de interfaces de usuario profesionales con Next.js
  App Router, React, Tailwind CSS y Radix UI. Usar cuando el usuario quiera:
  crear páginas, componentes, formularios, dashboards, layouts, flujos de
  onboarding, mejorar UX, implementar diseño responsive, animaciones,
  estados de carga, manejo de errores en UI, o cualquier aspecto visual
  del producto. Activar con: página, componente, UI, UX, diseño, formulario,
  dashboard, layout, responsive, accesibilidad, Tailwind, React.
---

# Frontend y UX/UI

## Principios de diseño

### Los 5 principios que guían cada decisión
1. **Claridad antes que creatividad** — el usuario debe entender al instante
2. **Acción principal siempre visible** — nunca esconder lo que el usuario debe hacer
3. **Feedback inmediato** — cada acción debe tener una respuesta visual
4. **Consistencia** — mismo patrón para casos similares en toda la app
5. **Cero fricción en el flujo crítico** — el camino principal debe ser el más fácil

---

## Arquitectura de componentes

### Regla de decisión: Server vs Client Component

```
¿Necesita useState, useEffect, eventos, hooks?
  SÍ → 'use client'
  NO → Server Component (sin directiva)

¿Hace fetch de datos?
  En Server Component → await directo (sin useEffect)
  En Client Component → solo si necesita reactividad
```

### Estructura de carpetas
```
src/
├── app/                    # Páginas (App Router)
│   ├── (app)/             # Layout autenticado
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   └── sales/
│   └── (public)/          # Layout público
├── components/
│   ├── ui/                # Componentes base (Button, Input, etc.)
│   ├── layout/            # Header, Sidebar, Footer
│   ├── forms/             # Formularios reutilizables
│   └── [módulo]/          # Componentes específico del módulo
└── hooks/                 # Custom hooks reutilizables
```

---

## Patrones de páginas

### Server Component — página de lista
```typescript
// src/app/(app)/inventory/page.tsx
import { createClient } from '@/lib/supabase/server'
import { InventoryList } from '@/components/inventory/InventoryList'
import { InventoryHeader } from '@/components/inventory/InventoryHeader'

export default async function InventoryPage() {
  const supabase = await createClient()
  
  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, price, stock, sku, type')
    .is('deleted_at', null)
    .order('name')
    .limit(50)

  return (
    <div className="space-y-6">
      <InventoryHeader />
      <InventoryList items={items ?? []} />
    </div>
  )
}
```

### Client Component — lista interactiva
```typescript
// src/components/inventory/InventoryList.tsx
'use client'

import { useState } from 'react'
import { useDebounce } from 'use-debounce'

interface InventoryListProps {
  items: InventoryItem[]
}

export function InventoryList({ items: initialItems }: InventoryListProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  
  const filtered = initialItems.filter(item =>
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar productos..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      {filtered.length === 0 ? (
        <EmptyState message="No hay productos que coincidan" />
      ) : (
        <div className="grid gap-4">
          {filtered.map(item => (
            <InventoryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Componentes base

### Botones — jerarquía visual
```typescript
// Primario — acción principal de la página (solo uno por vista)
<Button variant="default">Crear orden de trabajo</Button>

// Secundario — acciones de soporte
<Button variant="outline">Exportar</Button>

// Destructivo — acciones irreversibles (con confirmación)
<Button variant="destructive">Eliminar</Button>

// Ghost — acciones de navegación
<Button variant="ghost">Cancelar</Button>
```

### Estados de carga
```typescript
// Skeleton — para listas y cards
import { Skeleton } from '@/components/ui/skeleton'

function InventoryListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  )
}

// Spinner — para acciones de botón
<Button disabled={isLoading}>
  {isLoading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : null}
  Guardar
</Button>
```

### Estados vacíos — siempre con CTA
```typescript
function EmptyState({ 
  message, 
  action 
}: { 
  message: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

---

## Formularios

### Patrón con React Hook Form + Zod
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  price: z.number().min(0, 'Precio inválido'),
})

type FormData = z.infer<typeof schema>

export function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', price: 0 },
  })

  const onSubmit = async (data: FormData) => {
    try {
      // llamar server action o API
      const result = await createProduct(data)
      if (result.error) {
        toast.error('Error al guardar')
        return
      }
      toast.success('Producto creado')
      onSuccess()
    } catch {
      toast.error('Error inesperado')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <input
          {...form.register('name')}
          className="w-full border rounded-md px-3 py-2"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <Button 
        type="submit" 
        disabled={form.formState.isSubmitting}
        className="w-full"
      >
        {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
```

---

## UX — Reglas de oro

### Feedback siempre visible
```
Acción del usuario → Respuesta inmediata
Clic en botón    → Estado loading en <100ms
Submit exitoso   → Toast de confirmación
Submit con error → Mensaje en el campo, no generic error
Carga de datos   → Skeleton, nunca pantalla en blanco
Sin datos        → Empty state con acción sugerida
```

### Confirmación para acciones destructivas
```typescript
// Nunca borrar sin confirmar
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">Eliminar</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## Responsive design

### Breakpoints con Tailwind
```
sm:  640px  → Teléfonos grandes
md:  768px  → Tablets
lg:  1024px → Laptops
xl:  1280px → Escritorios
2xl: 1536px → Pantallas grandes
```

### Patrones responsive comunes
```typescript
// Grid que colapsa en móvil
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Stack vertical en móvil, horizontal en desktop
<div className="flex flex-col md:flex-row gap-4">

// Sidebar oculta en móvil
<aside className="hidden lg:block w-64">

// Tabla con scroll horizontal en móvil
<div className="overflow-x-auto">
  <table className="min-w-full">
```

---

## Accesibilidad mínima

```typescript
// Siempre aria-label en botones sin texto
<button aria-label="Cerrar modal">
  <X className="h-4 w-4" />
</button>

// Focus visible en elementos interactivos
className="focus:outline-none focus:ring-2 focus:ring-primary"

// Roles semánticos
<nav aria-label="Navegación principal">
<main>
<aside aria-label="Panel lateral">
```

---

## Checklist de UI

```
Funcional:
[ ] Estado de carga implementado
[ ] Estado vacío con mensaje y acción
[ ] Manejo de errores visible para el usuario
[ ] Confirmación en acciones destructivas
[ ] Formularios con validación visible

Diseño:
[ ] Un botón primario por vista
[ ] Jerarquía visual clara
[ ] Espaciado consistente (usar escala de Tailwind)
[ ] Responsive en móvil verificado

Accesibilidad:
[ ] Botones con texto o aria-label
[ ] Imágenes con alt text
[ ] Contraste suficiente (4.5:1 mínimo)
[ ] Navegación por teclado funcional

Rendimiento:
[ ] Imágenes con next/image
[ ] Listas con key única
[ ] Sin console.log en producción
[ ] Bundle sin imports innecesarios
```

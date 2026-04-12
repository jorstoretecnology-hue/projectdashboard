# 📊 Dashboard Universal

> Sistema de dashboard moderno con Next.js, TypeScript, sistema de diseño escalable y calidad de código profesional

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Latest-38bdf8)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-1.2-6E9F18)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-8.56-4B32C3)](https://eslint.org/)

---

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Abrir http://localhost:3000
```

## ✨ Características

**Versión**: 6.1.0  
**Última actualización**: 12 de abril, 2026  
**Estado**: 🟢 Producción-Ready (Blindaje & Inmunidad Operativa)

### Core
- ✅ **Next.js 16** con App Router y Turbopack
- ✅ **TypeScript** estricto
- ✅ **Tailwind CSS** & **Shadcn/UI**
- ✅ **Multi-tenancy** & **Branding Dinámico**
- ✅ **SuperAdmin Dashboard** centralizado
- ✅ **Módulo de Inventario** adaptable (Motor Propio)

### ✨ Características Estrella

*   **Inventario Flexible**: Adaptable a retail, hostelería, gimnasios y más.
*   **Aislamiento SaaS**: Clientes independientes con su propio branding y políticas RLS.
*   **Gestión de Equipo**: Sistema de invitaciones por email y control de roles.
*   **Infraestructura Pro**: Sentry para errores y Resend para correos transaccionales.
- ✅ **Prettier** formateo automático de código
- ✅ **Husky** pre-commit hooks
- ✅ **lint-staged** linting en archivos staged
- ✅ **Vitest** testing framework con React Testing Library
- ✅ **GitHub Actions** CI/CD automatizado

## 📁 Estructura

```
src/
├── app/              # Rutas y páginas (App Router)
│   ├── superadmin/   # 🆕 Gestión global de tenants
│   ├── tests/        # Tests de integración
│   ├── globals.css   # Estilos globales y tokens
│   ├── layout.tsx    # Layout raíz
│   └── page.tsx      # Página principal personalizada por tenant
├── components/
│   ├── layout/       # Componentes de layout (Navbar, Sidebar, TenantSelector)
│   └── ui/           # Componentes Shadcn/UI
├── config/           # Configuración de módulos y tenants (tenants.ts)
├── lib/              # Utilidades
├── providers/        # Context providers (TenantContext, ModuleContext)
├── tests/            # Tests unitarios
└── types/            # Definiciones de tipos TypeScript

docs/                 # Documentación del proyecto
├── PROJECT.md        # Documentación principal
├── INDEX.md          # 🆕 Índice de documentos
├── EXECUTIVE_SUMMARY.md # 🆕 Resumen ejecutivo y estado
├── QUALITY_AND_TESTING.md # 🆕 Guía de calidad y tests
├── ARCHITECTURE.md   # Arquitectura del sistema
├── DESIGN_SYSTEM.md  # Sistema de diseño
├── TROUBLESHOOTING.md # Solución de problemas
└── SHADCN_INVENTORY.md # Inventario de componentes
```


## 📚 Documentación

### Resumen Ejecutivo
- **[Estado del Proyecto](./PROJECT_STATE.md)** - 🆕 Snapshot actual, hitos y pendientes (Leerme primero)

### Para Desarrolladores
- **[Documentación Completa](./docs/PROJECT.md)** - Guía detallada del proyecto
- **[Arquitectura](./docs/ARCHITECTURE.md)** - Arquitectura del sistema
- **[Sistema de Diseño](./docs/DESIGN_SYSTEM.md)** - Tokens y paleta de colores
- **[Estándares de Código](./docs/CODE_STANDARDS.md)** - 🆕 Reglas y mejores prácticas
- **[Guía para IA](./docs/AI_DEVELOPMENT_GUIDE.md)** - 🆕 Lineamientos para desarrollo con IA

### Para Gestión
- **[Índice Maestro](./docs/INDEX.md)** - Guía de todos los documentos
- **[Resumen Ejecutivo](./docs/EXECUTIVE_SUMMARY.md)** - Estado actual y métricas
- **[Calidad y Testing](./docs/QUALITY_AND_TESTING.md)** - Guía de estandares y pruebas

### Referencia
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Solución de problemas comunes
- **[Shadcn Inventory](./docs/SHADCN_INVENTORY.md)** - Componentes instalados

## 🎨 Sistema de Temas & Branding

El proyecto incluye dos sistemas de personalización:

1.  **Temas Globales**: Solución de tema claro/oscuro (🌞 Claro / 🌙 Oscuro).
2.  **Branding por Tenant**: Inyección dinámica del color primario, logotipos y configuración según el cliente activo (SaaS Ready).

## 🛠️ Scripts

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
```

### Calidad de Código
```bash
npm run type-check   # Verificar tipos TypeScript
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir errores de ESLint
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato
```

### Testing
```bash
npm test             # Ejecutar tests
npm run test:watch   # Ejecutar tests en modo watch
```

### Verificación Completa
```bash
npm run check        # Ejecutar type-check, lint y test en paralelo
```

## 📝 Ejemplo de Uso

```tsx
import { useTheme } from 'next-themes';
import { useModuleContext } from '@/providers';

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { modules, toggleModule } = useModuleContext();
  
  return (
    <div className="bg-background text-foreground">
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="bg-primary text-primary-foreground"
      >
        Cambiar tema
      </button>
    </div>
  );
}
```

## 🧪 Testing

El proyecto incluye configuración completa de testing:

- **Framework**: Vitest con jsdom
- **Librería**: React Testing Library
- **Coverage**: Configurado con reporters text y lcov
- **Mocks**: Next.js navigation y hooks

```bash
# Ejecutar tests
npm test

# Modo watch
npm run test:watch

# Con coverage
npm test -- --coverage
```

## 🔧 Configuración de Calidad

### ESLint
- Parser: `@typescript-eslint/parser`
- Plugins: TypeScript, React, React Hooks, Import
- Reglas: Estrictas para TypeScript y React
- Configuración: `.eslintrc.cjs`

### Prettier
- Print width: 100
- Single quotes: true
- Trailing comma: all
- Semi: true
- Tab width: 2
- Configuración: `.prettierrc`

### Husky
- Pre-commit: Ejecuta lint-staged
- Configuración: `.husky/pre-commit`

## 🚀 CI/CD

GitHub Actions configurado para:
- ✅ Type checking
- ✅ Linting
- ✅ Testing
- ✅ Building

Se ejecuta en:
- Push a `main` o `develop`
- Pull requests a `main` o `develop`

Matriz de Node.js: 18.x, 20.x

## 🤝 Contribuir

### Convenciones de Código

1. **TypeScript**: Siempre usar tipos explícitos
2. **Componentes**: React.FC con interfaces
3. **Estilos**: Usar clases de Tailwind con tokens semánticos
4. **Testing**: Escribir tests para nuevas funcionalidades
5. **Commits**: Usar conventional commits

### Workflow

```bash
# 1. Crear rama
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y testear
npm run check

# 3. Commit (lint-staged se ejecuta automáticamente)
git commit -m "feat: agregar nueva funcionalidad"

# 4. Push
git push origin feature/nueva-funcionalidad
```

Ver [PROJECT.md](./docs/PROJECT.md) para guías detalladas de desarrollo.

## 📦 Dependencias Principales

### Producción
- `next` - Framework React
- `react` & `react-dom` - Librería UI
- `next-themes` - Gestión de temas
- `tailwindcss` - Estilos utility-first
- `lucide-react` - Iconos
- `@radix-ui/*` - Componentes primitivos accesibles

### Desarrollo
- `typescript` - Superset tipado de JavaScript
- `eslint` - Linter de código
- `prettier` - Formateador de código
- `vitest` - Framework de testing
- `@testing-library/react` - Testing de componentes
- `husky` - Git hooks
- `lint-staged` - Linting de archivos staged

## 🔐 Variables de Entorno

Copiar `.env.example` a `.env.local` y configurar:

```bash
# Entorno
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# App
NEXT_PUBLIC_APP_NAME=Dashboard Universal
NEXT_PUBLIC_DEFAULT_THEME=system

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Feature flags
NEXT_PUBLIC_FEATURE_EXAMPLE=false
```

- ✅ **Configuración inicial**: Completa
- ✅ **Sistema de diseño**: Implementado
- ✅ **Componentes UI**: Shadcn/UI integrado
- ✅ **Testing**: Configurado y funcionando
- ✅ **CI/CD**: GitHub Actions activo
- ✅ **Calidad de código**: ESLint + Prettier + Husky
- ✅ **SaaS Architecture**: Multi-tenancy implementado
- ✅ **Panel Admin**: SuperAdmin Dashboard funcional
- ✅ **Branding Dinámico**: CSS Variable injection activo
- ✅ **Autenticación**: Integración total con Supabase Auth (Email & Google)
- ✅ **Emails Transaccionales**: Motor de notificaciones con Resend
- ✅ **Invitaciones**: Sistema de crecimiento de equipos y auto-onboarding
- 🚧 **Pagos (Stripe)**: Próximamente
- 🚧 **Internacionalización**: Pendiente

## 🐛 Troubleshooting

Ver [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) para soluciones a problemas comunes:

- Hydration mismatches
- Problemas de theming
- Errores de build
- Configuración de tokens

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**Desarrollado con ❤️ usando Next.js, TypeScript y Tailwind CSS**

**Versión**: 6.1.0  
**Última actualización**: 2026-04-12

# Walkthrough - Dashboard Universal SaaS

Este documento proporciona un recorrido paso a paso para configurar, desarrollar y desplegar el proyecto Dashboard Universal SaaS.

## Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Desarrollo Local](#desarrollo-local)
5. [Base de Datos](#base-de-datos)
6. [Módulos y Activación](#módulos-y-activación)
7. [Seguridad](#seguridad)
8. [Despliegue](#despliegue)
9. [Solución de Problemas](#solución-de-problemas)

---

## Prerrequisitos

- Node.js (versión específica del proyecto)
- npm o pnpm
- Supabase CLI
- Docker (opcional, para desarrollo local con contenedores)

## Configuración Inicial

1. Clonar el repositorio
2. Copiar `.env.example` a `.env.local`
3. Configurar las variables de entorno de Supabase
4. Instalar dependencias: `npm install`

## Estructura del Proyecto

```
E:\ProyectDashboard\
├── src/              # Código fuente principal
├── supabase/         # Migraciones y configuración de Supabase
├── docs/             # Documentación del proyecto
└── ...
```

## Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ejecutar chequeos de código
npm run check
```

## Base de Datos

### Ejecutar Migraciones

Las migraciones SQL se encuentran en `supabase/migrations/`. Para aplicarlas:

1. Abrir Supabase SQL Editor
2. Ejecutar los scripts en orden cronológico

### Activación de Módulos

Ver `IMPLEMENTATION_STEPS.md` para detalles sobre la activación automática de módulos para tenants.

## Módulos y Activación

El sistema soporta múltiples módulos que pueden activarse por tenant. Consultar la documentación específica en `docs/` para más detalles.

## Seguridad

**Importante**: Todas las operaciones de base de datos deben seguir la [Guía Rápida de Seguridad](docs/SECURITY_QUICK_REFERENCE.md):

- ❌ Prohibido: `SELECT *`
- ✅ Obligatorio: RLS (Row Level Security)
- ✅ Obligatorio: Auditoría de integridad

## Despliegue

Consultar la documentación de Docker en `docker/` para instrucciones de despliegue con contenedores.

## Solución de Problemas

### Errores Comunes

1. **Problemas de dependencias**: Ejecutar `npm install` y verificar `knip-output.txt`
2. **Errores de TypeScript**: Ejecutar `npm run check`
3. **Problemas de base de datos**: Verificar migraciones aplicadas en Supabase

### Logs y Debugging

- Revisar `build_log.txt` para errores de compilación
- Consultar logs de Supabase para problemas de base de datos

---

## Recursos Adicionales

- [Architecture Summary](ARCHITECTURE_SUMMARY.md)
- [Implementation Steps](IMPLEMENTATION_STEPS.md)
- [AI Coordination](AI_COORDINATION.md)
- [Change Log](CHANGELOG.md)

---

## Auditoría y Hardening Final (Estado Zero Critical)

El **18 de Marzo de 2026**, luego de una sesión de hardening exhaustiva, el proyecto alcanzó exitosamente el estado **"Zero Critical"** en su pipeline de seguridad automatizado liderado por los agentes (Qwen y Antigravity). 

**Acciones Críticas Realizadas:**
- **Eliminación Total de `select(*)`**: Se sustituyó en todos los servicios de negocio principales (clientes, inventario, tenant, servicios) la extracción indiscriminada de datos por proyecciones explícitas de columnas, previniendo fuga de datos sensibles y optimizando el payload.
- **Saneamiento de Tipado (Cero Any)**: Se eliminó en su totalidad el uso del tipo inseguro `any` en los servicios core (`AuditService`, `CustomersService`, contextos de React, wrappers de API). Ahora todos los datos hacen uso de `unknown` y aserciones estrictas inferidas del modelo y la BD (`Customer['identificationType']`, `Database['public']['Tables']...`).
- **Logger Centralizado**: Finalización de la migración de `console.warn` y `console.error` hacia el singleton `logger.ts` para un manejo de trazas limpio e interconectable.
- **Refactorización Estable para Testing**: Se modernizaron los servicios para usar inyección de dependencias completa a través del constructor (SupabaseClient y AuditLogService), evitando colapsos globales en suites de pruebas donde no existen variables de entorno.
- **Salud del Pipeline del Código**: Todos los tests locales (24/24) son aprobados limpiamente en Vitest, y `tsc --noEmit` junto con el linter certifican la total ausencia de errores lógicos o de aserción.

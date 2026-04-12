---
name: antigravity-conventions
description: >
  Convenciones críticas y reglas inmutables del proyecto Antigravity.
  Usar SIEMPRE al crear módulos, definir precios, configurar el sistema,
  o tomar decisiones arquitectónicas. Incluye: nomenclatura de módulos,
  formato de precios, estructura de proxy.ts, y flujo de activación.
  Activar con: convenciones, reglas, estándar, nomenclatura, precio,
  módulo, proxy, middleware, configuración.
---

# Convenciones de Antigravity SaaS

## 1. Nomenclatura de Módulos

**Regla:** Los slugs de los módulos en la base de datos (`modules_catalog`) y en el código DEBEN estar en **lowercase** y usar guiones bajos si es necesario.

| Correcto      | Incorrecto                  |
| ------------- | --------------------------- |
| `work_orders` | `WorkOrders`, `Work-Orders` |
| `inventory`   | `Inventory`                 |
| `sales`       | `Sales`                     |

**Razón:** Sincronización exacta con la tabla `tenant_modules` y las políticas RLS.

---

## 2. Gestión de Precios y Moneda

**Regla:** Todos los precios en el sistema se manejan como **INTEGER** en pesos colombianos (**COP**). NUNCA usar decimales.

- **Frontend:** Formatear usando `Intl.NumberFormat('es-CO')`.
- **Backend/DB:** Almacenar como `integer` o `bigint`.
- **Lógica:** Redondear siempre al entero más cercano antes de guardar.

---

## 3. Archivo de Middleware — REGLA INMUTABLE

En este proyecto con Next.js 16.2.2, el archivo de middleware
se llama `src/proxy.ts` — NO `src/middleware.ts`.

Razón: Next.js 16 deprecó middleware.ts. Renombrarlo causa:

- Hanging durante compilación
- Warnings en consola
- Fallos en protección de rutas

NUNCA renombrar este archivo sin consultar al orquestador (Claude).
NUNCA sugerir usar middleware.ts en este proyecto.

---

## 4. Flujo de Activación de Módulos

**Regla:** La activación de módulos por plan e industria es **automática** mediante triggers de base de datos.

1. El usuario se registra y elige industria/plan.
2. Se inserta en `subscriptions`.
3. El trigger `activate_modules_on_subscription` llama a la función RPC `activate_modules_for_tenant`.
4. El sistema de UI refleja los cambios tras el próximo login o refresco de sesión.

---

## 5. Estructura de "Industrias"

**Regla:** El sistema es **Multi-Industria Progresivo**. No creamos aplicaciones separadas, sino "vistas" o "vuelos" sobre el mismo core.

- **Componentes:** Usar el `industry_type` del perfil del usuario para condicionar la UI.
- **Config:** Consultar `public.industry_pricing` para obtener límites y precios específicos.

---

## 6. Reglas de Código (Recordatorio Rápido)

- **RLS:** `SELECT` siempre con `.eq('tenant_id', ...)`
- **No `any`:** Usar `type definitions` o `unknown`.
- **No `select('*')`:** Listar campos explícitamente.
- **Zod:** Validar cada `Request` y `Action`.

---

## 7. Eficiencia de Búsqueda (Tokens)

**Regla:** Minimizar el consumo de tokens mediante búsquedas quirúrgicas y evitar la lectura masiva de archivos irrelevantes.

- **Exclusiones:** NUNCA buscar en `node_modules`, `.next`, `.git`, `.qwen`, `.qodo`, o `.antigravity`.
- **Límites:** No leer archivos > 50KB completos; usar `grep` para encontrar líneas específicas.
- **Precisión:** Prefijar búsquedas recursivas con la ruta del módulo (ej. `src/modules/sales/`).

---

## checklist de cumplimiento

[ ] Módulos en lowercase.
[ ] Precios como Integer COP.
[ ] RLS verificado con tenant_id.
[ ] Sin select(\*) ni tipos any.
[ ] Búsqueda quirúrgica (eficiencia de tokens).

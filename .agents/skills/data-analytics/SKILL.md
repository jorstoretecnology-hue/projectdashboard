---
name: data-analytics
description: >
  Análisis de datos, métricas de negocio, dashboards y toma de
  decisiones basada en datos para SaaS. Usar cuando el usuario quiera:
  crear reportes, definir métricas clave, construir un dashboard de
  negocio, analizar el comportamiento de usuarios, medir el crecimiento,
  identificar cuellos de botella, o entender los datos del producto.
  Activar con: métricas, dashboard, reporte, analítica, datos, KPI,
  MRR, churn, conversión, embudo, comportamiento, tendencia.
---

# Analítica y Métricas de Negocio

## 1. Métricas Críticas (El Pulso del SaaS)

**Métricas Mensuales (MRR):**
- **MRR Total:** Suma de suscripciones activas en COP.
- **New MRR:** Nuevos clientes del mes.
- **Expansion MRR:** Upgrades de plan.
- **Churn MRR:** Cancelaciones del mes.

**Salud Operativa:**
- **LTV:** Valor de vida del cliente.
- **CAC:** Costo de adquisición por canal.
- **ARPU:** Promedio de ingresos por usuario.

---

## 2. Dashboard de Negocio (SuperAdmin)
Visualización centralizada en `/console/analytics`:
- **KPI Cards:** MRR, Churn inicial, Active Tenants.
- **Gráficos de Crecimiento:** Línea de MRR últimos 12 meses.
- **Torta de Industrias:** Distribución de ingresos por sector.

---

## 3. Comportamiento del Usuario (Events)
**Regla:** Trackear eventos clave en la tabla `domain_events` para medir activación.
- `signup_completed`
- `first_sale_created`
- `plan_upgraded`
- `onboarding_finished`

*Nota:* No usar herramientas externas pesadas; usar directamente la base de datos Supabase para métricas core.

---

## 4. Reportes para Tenants (Industria)
Cada industria tiene sus métricas clave:
- **Taller:** Tiempo promedio de reparación (TAT), ticket promedio.
- **Gym:** Tasa de asistencia, renovaciones próximas.
- **Glamping:** Tasa de ocupación, RevPAR.

---

## 5. Decisiones Basadas en Datos
**Regla:** Antes de lanzar una feature, definir la métrica que esperamos mover.
- **Ejemplo:** Lanzamos WhatsApp para bajar el churn un 10%.
- **Validación:** Comparar métricas mes a mes tras el lanzamiento.

---

## checklist de analítica
[ ] MRR calculado y actualizado automáticamente.
[ ] Eventos de activación registrados en `domain_events`.
[ ] Dashboard de superadmin con KPIs principales.
[ ] Reportes específicos por industria disponibles.

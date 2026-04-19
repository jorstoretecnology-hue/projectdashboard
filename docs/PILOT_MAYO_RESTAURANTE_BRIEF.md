# 🎯 PILOTO MAYO 2026 — Restaurante, Bar & Piscina

&gt; **Documento Vivo:** Fuente de verdad para la fase piloto del vertical gastronomía.
&gt; **Última actualización:** 18 de abril de 2026
&gt; **Versión:** 1.0 (Scope Congelado)
&gt; **Stakeholder Cliente:** [Nombre Amiga] — Restaurante platos típicos + bar + piscina
&gt; **Deadline operativo:** Primera semana de mayo de 2026

---

## 1. RESUMEN EJECUTIVO (Para el cliente)

Implementaremos un **sistema de caja y control de mesas** para tu apertura. Esto incluye:

✅ **Cobros en caja** — Efectivo, datáfono, Nequi y Daviplata (pagos mixtos permitidos).  
✅ **Turnos de caja** — Cada persona (dueña, bartender) abre y cierra su propia caja. Nadie se mete en la plata del otro.  
✅ **Mesas y barra** — Los meseros toman pedido desde una tablet.  
✅ **Menú de platos típicos** — Subimos tu carta fija. El corrientazo del día se actualiza manual.  
✅ **Control de insumos (manual)** — Tú registras entradas de mercancía (arroz, licor, etc.). El sistema te avisará cuando algo esté bajo, pero no descontará automático todavía.  
✅ **Soporte de factura sencilla** — Cumplimos normativa DIAN básica para apertura sin complejidad.

❌ **No incluye (fase 2):** Inventario automático por recetas, facturación electrónica avanzada, cabañas ni automatizaciones WhatsApp.

---

## 2. CONTEXTO DEL NEGOCIO (La operación real)

| Aspecto             | Detalle                                                                 | Impacto técnico                                                                                                |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Industria**       | Gastronomía + entretenimiento (restaurante, bar, piscina)               | Vertical piloto para el SaaS. Si funciona, se convierte en template replicable.                                |
| **Menú**            | Platos típicos fijos + corrientazo variable diario                      | Productos fijos en catálogo. El corrientazo se maneja como producto "Corrientazo del día" con precio editable. |
| **Operación**       | Restaurante 8 AM - 10 PM. Bar puede extenderse hasta 1-2 AM.            | **Multi-shift obligatorio.** Cada operario maneja su propia caja.                                              |
| **Pagos**           | Efectivo, datáfono (externo), Nequi, Daviplata                          | **Pagos mixtos obligatorios.** Una misma cuenta puede pagarse con dos métodos.                                 |
| **Personal**        | Dueña + mesero(s) + bartender. Negocio familiar/pyme.                   | Permisos simples: ADMIN/OWNER abren turnos. Sin jerarquías rígidas.                                            |
| **Insumos**         | Cocina (arroz, aceite, pollo) + bar (licores, cervezas, gaseosas)       | Inventario unificado pero categorizado. Unidades base: gramos (g) y mililitros (ml).                           |
| **Ley 1581 / DIAN** | Obligatorio facturar. Para apertura usamos factura de soporte/sencilla. | Checkbox de aceptación de datos en clientes. Log de IP (`data_consent_ip`) activo.                             |

---

## 3. ALCANCE PILOTO MAYO (Scope Congelado)

### 3.1 Módulos activos en el tenant

| Módulo      | Estado          | Notas                                                                 |
| ----------- | --------------- | --------------------------------------------------------------------- |
| `sales`     | ✅ Activo       | POS con pagos mixtos.                                                 |
| `customers` | ✅ Activo       | Captura opcional de nombre + celular en caja.                         |
| `inventory` | ✅ Activo       | **Registro manual de entradas.** Sin descuento automático por ventas. |
| `dian`      | ⚠️ Simplificado | Solo factura de soporte/sencilla. Sin Alegra todavía.                 |
| `tables`    | ✅ Nuevo        | Grid de mesas/barras. Pedido desde tablet.                            |
| `shifts`    | ✅ Nuevo        | Turnos de caja por operario.                                          |
| `recipes`   | ❌ Inactivo     | Schema disponible pero `is_active = false`. Se activa en junio.       |

### 3.2 Features incluidas

- [ ] **Apertura de turno:** Usuario (ADMIN/OWNER) abre caja con monto inicial.
- [ ] **Toma de pedido:** Selección de mesa → agregar productos → enviar a cocina (pantalla o impresión simple).
- [ ] **Cobro mixto:** Dividir pago entre efectivo y transferencia (Nequi/Daviplata). Verificación manual de transferencias.
- [ ] **Cierre de turno:** Cuadre de caja (efectivo esperado vs contado). Reporte simple.
- [ ] **Turnos simultáneos:** Dueña cierra restaurante 10 PM. Bartender sigue con su turno independiente.
- [ ] **Inventario manual:** Entrada de compras en gramos/ml. Alertas de stock bajo configurables.
- [ ] **Corrientazo del día:** Producto especial con precio y descripción editables diariamente.
- [ ] **Comprobante de venta:** Impresión térmica o envío por WhatsApp (si es posible técnicamente).

### 3.3 Features explícitamente EXCLUIDAS de mayo

| Feature                                           | Razón                                                                                  | Cuándo            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------- |
| Descontar inventario automático por recetas (BOM) | Ella debe validar primero pesos y medidas reales. Riesgo de desconfianza si no cuadra. | Junio 2026        |
| Facturación electrónica DIAN (Alegra)             | Requiere resolución de facturación y homologación. Riesgo para fecha de apertura.      | Julio 2026        |
| Cabañas / hospedaje                               | No existe infraestructura física todavía.                                              | Post-octubre 2026 |
| Automatizaciones (WhatsApp, alertas auto)         | Un solo local, 2-3 personas. ROI cero.                                                 | 3+ sedes          |
| App nativa móvil                                  | Se usa tablet con navegador (PWA).                                                     | No planeado       |
| Reportes avanzados (costos, utilidad)             | Sin recetas activas no hay costeo real.                                                | Junio 2026        |

---

## 4. DECISIONES TÉCNICAS VALIDADAS

Estas decisiones ya fueron aprobadas. **No reabrir sin justificación técnica nueva.**

### 4.1 Arquitectura de datos

| Decisión            | Implementación                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| **Multi-tenancy**   | Tenant aislado en Supabase con RLS por `tenant_id`.                                                       |
| **Shifts (turnos)** | Tabla `shifts`. Un usuario no puede tener dos turnos abiertos. OWNER puede forzar cierre.                 |
| **Pagos mixtos**    | Tabla `sale_payments` (1:N con `sales`). Campo `sales.payment_method` queda legacy.                       |
| **Mesas**           | Tabla `tables`. `sales.table_id` como FK. Estado de mesa: AVAILABLE, OCCUPIED, CLEANING.                  |
| **Inventario**      | Tabla `inventory_items` con `unit_of_measure` (g/ml/unidad). Entradas manuales vía `inventory_movements`. |
| **Recetas**         | Tablas `recipes` + `recipe_items`. Construidas en schema pero inactivas (`is_active = false`).            |
| **UOM**             | Sistema base fijo: compras y ventas en gramos/ml. Sin tabla de conversiones todavía.                      |
| **Corrientazo**     | `products` con flag `is_daily_special = true` o manejo manual de precio.                                  |
| **DIAN Mayo**       | Comprobante interno. No integración con Alegra.                                                           |

### 4.2 Seguridad y compliance

| Decisión                 | Implementación                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------- |
| **RLS**                  | Todas las queries filtran por `tenant_id` resuelto server-side desde JWT.           |
| **Consentimiento datos** | Checkbox obligatorio Ley 1581 en registro de clientes. IP y timestamp persistidos.  |
| **Auditoría**            | `audit_logs` registra aperturas/cierres forzados de turnos.                         |
| **Permisos**             | Opción A: ADMIN/OWNER abren turnos. Sin fricción de permisos granulares para pymes. |

### 4.3 UX / Flujo operativo

1. Dueña/Bartender llega → Abre turno (`cash_initial`) → Sistema habilitado para ventas.
2. Mesero toma pedido en tablet → Selecciona mesa → Agrega productos → `sale` en estado `OPEN`.
3. Cliente pide cuenta → Mesero/cierra `sale` → Pantalla de cobro.
4. Cajero selecciona métodos de pago → Crea registros en `sale_payments` → Marca `sale` como `COMPLETED`.
5. Fin de turno → Cierre de caja (`cash_final` vs esperado) → Turno `CLOSED`.
6. Dueña revisa reporte diario consolidado (todos los turnos del día).

---

## 5. MODELO DE NEGOCIO PILOTO

| Concepto               | Valor                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Setup**              | Configuración inicial de tenant, menú y capacitación (1 sesión).                         |
| **Precio mayo**        | $100.000 - $150.000 COP (50% descuento plan Starter).                                    |
| **Precio junio-julio** | $200.000 - $300.000 COP (precio completo).                                               |
| **Soporte mayo**       | WhatsApp directo, horario comercial. Solo bugs y bloqueos.                               |
| **Compromiso cliente** | Usar el sistema como caja principal. No backup en papel. Reportar fallos inmediatamente. |
| **Salida**             | Si a los 3 meses no hay valor, cancelación sin penalidad.                                |

---

## 6. CHECKLIST DE ENTRADA (Antes de escribir código)

No iniciar desarrollo hasta tener:

- [ ] **Confirmación escrita** de la cliente aceptando scope y precio.
- [ ] **Lista de productos inicial:** Mínimo 10 platos típicos + 5 bebidas + insumos básicos (nombres y precios de venta).
- [ ] **Definición de corrientazo:** ¿Tiene precio fijo o variable? ¿Qué días se sirve?
- [ ] **Hardware confirmado:** ¿Tablet para mesero? ¿Laptop/PC para caja? ¿Impresora térmica?
- [ ] **Perfiles de usuario:** ¿Cuántos usuarios? ¿Quién es bartender? ¿Tienen celular/tablet?
- [ ] **Métodos de pago reales:** ¿Ya tiene datáfono de un banco? ¿Ella maneja Nequi/Daviplata comercial o personal?
- [ ] **Stock inicial aproximado:** ¿Cuánto arroz, aceite, cerveza compra para la primera semana? (Para dar de alta inventario inicial).

---

## 7. RIESGOS IDENTIFICADOS

| Riesgo                                   | Probabilidad | Mitigación                                                                                                            |
| ---------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Ella no tiene lista de precios para mayo | Alta         | Pedirla esta semana. Si no llega, usar precios estimados y que ella los edite después.                                |
| Bartender no quiere usar sistema         | Media        | Capacitación de 15 min. Si rechaza totalmente, reducir a caja única (dueña cobra todo).                               |
| Internet falla en el local               | Media        | Diseñar para que funcione offline 5-10 min y sincronice después (o al menos no pierda la venta actual).               |
| DIAN exige más que factura sencilla      | Baja         | Confirmar con contador. Si es obligatorio Alegra desde día 1, mover fecha de go-live o contratar integración express. |
| Inventario manual la frustra             | Media        | Dejar claro que es temporal (2-4 semanas). Automatización es fase 2.                                                  |

---

## 8. NOTAS PARA DESARROLLADORES / IA

### Contexto del proyecto general

Este piloto es parte del **Dashboard Universal SaaS v6.2.0**. El objetivo es validar el vertical de gastronomía usando la arquitectura multi-tenant existente.

### Tablas existentes que se reutilizan

- `tenants`, `profiles`, `locations` (multi-tenancy base)
- `products`, `inventory_items`, `inventory_movements` (inventario)
- `sales`, `sale_items` (ventas base)
- `customers` (CRM)
- `audit_logs` (auditoría)
- `modules_catalog`, `tenant_modules` (activación de features)

### Tablas nuevas a crear

- `tables` (mesas físicas)
- `shifts` (turnos de caja)
- `sale_payments` (pagos mixtos 1:N)
- `recipes` (cabecera BOM — inactiva mayo)
- `recipe_items` (insumos por receta — inactiva mayo)

### Reglas de oro del codebase

1. **RLS:** Todo query filtra `tenant_id` desde JWT. Nunca desde el cliente.
2. **TypeScript:** Cero `any`. Validar con Zod todo input.
3. **Campos explícitos:** Prohibido `select('*')`.
4. **Moneda:** Todo precio es INTEGER COP.
5. **Server-side:** `tenant_id` se resuelve en Server Action/Component. Nunca del body.

### Dependencias externas

- **Supabase Free Tier:** Límite 500MB. Este piloto no lo supera.
- **Resend:** Emails transaccionales (invitaciones, recuperación). No crítico para operación diaria.
- **No usar:** Upstash (eliminar), Sentry (posponer), n8n (posponer).

---

## 9. HISTORIAL DE CAMBIOS

| Fecha      | Versión | Cambio                                                      | Autor              |
| ---------- | ------- | ----------------------------------------------------------- | ------------------ |
| 2026-04-18 | 1.0     | Documento inicial. Scope congelado post-validación técnica. | Agencia/Arquitecto |

---

## 10. PRÓXIMOS PASOS INMEDIATOS

1. **Hoy:** Enviar este documento (secciones 1-5) a la cliente por WhatsApp/email.
2. **Esta semana:** Reunión de 30 min para llenar el Checklist de Entrada (sección 6).
3. **Siguiente semana:** Si checklist completo → iniciar desarrollo. Si no → posponer o pivotar a ferreterías.

---

**Fin del documento.**

_Para contexto general del proyecto, ver: `CONTEXTO_DEL_PROYECTO.md`, `PROGRESS_TRACKER.md`, `ARCHITECTURE_SUMMARY.md`._

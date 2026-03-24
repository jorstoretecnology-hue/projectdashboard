# 📡 Sistema de Comunicación (COMMUNICATION_SYSTEM.md)

## 1. Diseño Multi-Provider
El sistema desacopla el canal de comunicación del proveedor técnico para garantizar resiliencia y optimización de costos.

### Estructura de Resolución
1. **Tenant Preference**: El cliente elige el canal (WhatsApp, Email).
2. **Provider Selector**: El sistema consulta las integraciones activas del tenant.
3. **Internal Router**: Dirige el payload al adaptador correspondiente (Meta, Resend, Twilio, etc.).

## 2. Despacho y Ejecución (Communication Service)
El servicio central se encarga de:
- **Manejo de Errores**: Captura respuestas de APIs de terceros (401, 429, 500).
- **Retry Engine**: Algoritmo de backoff exponencial.
- **Logging Transaccional**: Registro en `automation_executions` con ID de mensaje externo.
- **Auditoría**: Trazabilidad completa desde `AutomationID` hasta `StatusCallback`.

---

## 📄 3. Motor de Plantillas Dinámicas

### Concepto
Permite personalizar comunicaciones automáticas mediante la sintaxis de etiquetas doble llave `{{variable}}`.

### Sintaxis y Validación
- **Formato**: `{{nombre_variable}}` (solo alfanuméricos y guiones bajos).
- **Validación Estricta**: Verifica que las variables existan en la **Lista Blanca** autorizada para el contexto.

### Lista Blanca por Contexto (Whitelist)
- **Inventario**: `{{producto_nombre}}`, `{{producto_sku}}`, `{{stock_actual}}`.
- **Clientes/CRM**: `{{cliente_nombre}}`, `{{cliente_email}}`, `{{negocio_nombre}}`.
- **Servicios**: `{{vehiculo_marca}}`, `{{vehiculo_placa}}`, `{{servicio_costo}}`.

### Seguridad del Renderizado
- **Validación de Identidad**: Verifica que el objeto pertenezca al `tenant_id` emisor.
- **No Ejecución**: Solo permite interpolación de texto; sin lógica ni código arbitrario.
- **Fallback Seguro**: Uso de valores por defecto o aborto del envío (`ABORTED_MISSING_DATA`) si falta información crítica.
- **Prevención XSS**: Escape automático de etiquetas HTML en correos electrónicos.

---

## 4. Ejemplos Industriales

### Taller (WhatsApp)
> Hola `{{cliente_nombre}}`, tu `{{vehiculo_marca}}` con placa `{{vehiculo_placa}}` ya está listo para ser retirado en `{{negocio_nombre}}`. Costo: `{{servicio_costo}}`.

### Retail (Email)
> Aviso de Stock: El producto `{{producto_nombre}}` (SKU: `{{producto_sku}}`) ha alcanzado nivel crítico: `{{stock_actual}}` unidades en `{{negocio_nombre}}`.

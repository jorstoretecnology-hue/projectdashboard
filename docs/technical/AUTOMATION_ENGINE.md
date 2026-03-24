# ⚙️ Motor de Automatización (AUTOMATION_ENGINE.md)

## 1. Filosofía: "Smart, not Complex"
El motor de automatización está diseñado para que un dueño de negocio sin conocimientos técnicos pueda delegar tareas repetitivas al sistema. No buscamos que el usuario cree reglas complejas, sino que elija entre soluciones operativas probadas.

## 2. Modelo Conceptual

### Entidades Core
- **`automation_templates`**: El catálogo "maestro" de automatizaciones. Define el disparador (ej: `on_inventory_stock_change`), los parámetros posibles y el mensaje base.
- **`tenant_automations`**: La configuración específica de un cliente. Vincula una plantilla a un tenant y define:
  - `status`: Si está activa o no.
  - `config`: Objeto JSON con los parámetros (ej: `days_before: 2`).
  - `channel`: Canal preferido (WhatsApp, Email, SMS).
- **`automation_executions`**: El log inmutable de cada disparo. Contiene el estado (success/failed), el payload y errores si los hubo.

## 3. Flujo de Ejecución (Lifecycle)

1. **Trigger (Hook)**: Un cambio de estado en la base de datos o un evento temporal dispara el motor.
2. **Context Resolution**: Se identifica al tenant y se busca si tiene activa la automatización vinculada a ese trigger.
3. **Parameter Injection**: Se cargan los parámetros del tenant y se evalúan contra la plantilla.
4. **Dispatch**: Se envía la tarea al `Communication Service`.
5. **Finalize**: Se registra el resultado en la tabla de ejecuciones.

## 4. Ejemplos de Plantillas por Industria

### Taller Mecánico
- **Aviso de Vehículo Listo**: Se dispara cuando el estado del servicio pasa a "Reparado".
- **Recordatorio de Mantenimiento**: Se dispara 6 meses después de la última visita.

### Restaurante/Retail
- **Alerta de Stock Crítico**: Se dispara cuando el stock físico es inferior al umbral configurado.
- **Confirmación de Compra**: Se dispara inmediatamente tras el registro de un pedido.

## 5. Seguridad e Idempotencia
- **Safe Variables**: Solo se permite el uso de variables pertenecientes a una "lista blanca" definida en la plantilla.
- **Control de Duplicados (Idempotencia)**: El sistema verifica que no se haya enviado el mismo tipo de mensaje al mismo cliente en un periodo corto (para evitar SPAM por errores de trigger).
- **Rate Limiting**: Límites internos por tenant para evitar bloqueos por parte de proveedores (Meta/Resend).

## 6. Manejo de Errores
- **Retry Logic**: El motor intentará reenviar el mensaje hasta 3 veces en caso de errores de red o temporales del proveedor.
- **Dead Letter Queue**: Si tras los reintentos falla, se marca como "Failed" y se notifica al SuperAdmin/Tenant según la gravedad.

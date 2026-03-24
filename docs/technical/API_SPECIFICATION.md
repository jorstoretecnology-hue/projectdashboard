# 🌐 Especificación de API (API_SPECIFICATION.md)

> Contrato completo de la API REST para el Smart Business OS. Define todos los endpoints, schemas, autenticación y manejo de errores.

---

## 📐 1. Principios de la API

### Reglas de Oro
1. **RESTful**: Usar verbos HTTP correctos (GET, POST, PATCH, DELETE)
2. **Versionado**: Todos los endpoints tienen prefijo `/api/v1`
3. **JWT Auth**: Bearer token en header `Authorization`
4. **Multi-tenant**: Validación de `tenant_id` en cada request
5. **Rate Limiting**: 100 req/min por usuario, 1000 req/min por tenant
6. **Idempotencia**: Usar `Idempotency-Key` header para operaciones críticas

### Formato de Respuesta Estándar
```typescript
// Success (2xx)
{
  "data": T,
  "meta": {
    "timestamp": "2026-02-13T15:30:00Z",
    "request_id": "uuid"
  }
}

// Error (4xx, 5xx)
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Opcional
  },
  "meta": {
    "timestamp": "2026-02-13T15:30:00Z",
    "request_id": "uuid"
  }
}
```

---

## 🔐 2. Autenticación y Autorización

### 2.1 Login
```http
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "app_role": "ADMIN",
      "tenant_id": "uuid",
      "tenant": {
        "id": "uuid",
        "name": "ACME Corporation",
        "plan": "professional",
        "industry_type": "taller"
      }
    }
  }
}

Errors:
401 INVALID_CREDENTIALS: Email o contraseña incorrectos
403 ACCOUNT_SUSPENDED: Cuenta suspendida
429 TOO_MANY_ATTEMPTS: Demasiados intentos fallidos
```

### 2.2 Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

Request:
{
  "refresh_token": "eyJhbGc..."
}

Response: 200 OK
{
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 86400
  }
}

Errors:
401 INVALID_TOKEN: Token inválido o expirado
```

### 2.3 Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {access_token}

Response: 204 No Content

Errors:
401 UNAUTHORIZED: Token inválido
```

---

## 📦 3. Módulo: Productos (Inventory)

### 3.1 Listar Productos
```http
GET /api/v1/products?page=1&limit=50&state=DISPONIBLE&search=filtro
Authorization: Bearer {access_token}
Required Role: VIEWER+

Query Params:
- page: number (default: 1)
- limit: number (default: 50, max: 100)
- state: 'DISPONIBLE' | 'BAJO_STOCK' | 'CRÍTICO' | 'AGOTADO' | 'BLOQUEADO'
- search: string (busca en nombre, SKU, descripción)
- category: string
- sort: 'name' | 'price' | 'stock' | 'created_at' (default: 'created_at')
- order: 'asc' | 'desc' (default: 'desc')

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "Filtro de Aceite Yamaha R1",
      "description": "Filtro original para Yamaha R1 2020",
      "price": 25.50,
      "stock": 15,
      "state": "DISPONIBLE",
      "category": "Repuestos",
      "sku": "YAMAHA-R1-FILTER-2020",
      "image": "https://...",
      "industry_type": "taller",
      "threshold_low": 10,
      "threshold_critical": 3,
      "is_blocked": false,
      "metadata": {
        "marca": "yamaha",
        "modelo": "R1",
        "ano": 2020,
        "tipo_vehiculo": "moto"
      },
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-02-10T14:20:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "total_pages": 3
  }
}

Errors:
401 UNAUTHORIZED: Token inválido
403 FORBIDDEN: Sin permisos de lectura
```

### 3.2 Obtener Producto
```http
GET /api/v1/products/{id}
Authorization: Bearer {access_token}
Required Role: VIEWER+

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "Filtro de Aceite Yamaha R1",
    // ... campos completos
    "movements": [ // Últimos 10 movimientos
      {
        "id": "uuid",
        "type": "VENTA",
        "quantity": -2,
        "previous_stock": 17,
        "new_stock": 15,
        "created_at": "2026-02-13T10:00:00Z"
      }
    ]
  }
}

Errors:
404 NOT_FOUND: Producto no existe
403 FORBIDDEN_CROSS_TENANT: Producto pertenece a otro tenant
```

### 3.3 Crear Producto
```http
POST /api/v1/products
Authorization: Bearer {access_token}
Required Role: ADMIN+
Content-Type: application/json

Request:
{
  "name": "Filtro de Aceite Yamaha R1",
  "description": "Filtro original para Yamaha R1 2020",
  "price": 25.50,
  "stock": 20,
  "category": "Repuestos",
  "sku": "YAMAHA-R1-FILTER-2020", // Opcional, se auto-genera si no se provee
  "image": "https://...", // Opcional
  "threshold_low": 10, // Opcional, default: 10
  "threshold_critical": 3, // Opcional, default: 3
  "metadata": { // Campos específicos de industria
    "marca": "yamaha",
    "modelo": "R1",
    "ano": 2020,
    "tipo_vehiculo": "moto"
  }
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    // ... producto completo
    "state": "DISPONIBLE" // Auto-calculado
  }
}

Errors:
400 VALIDATION_ERROR: Datos inválidos
403 FORBIDDEN: Rol insuficiente
409 QUOTA_EXCEEDED: Límite de productos alcanzado
409 SKU_ALREADY_EXISTS: SKU duplicado
```

### 3.4 Actualizar Producto
```http
PATCH /api/v1/products/{id}
Authorization: Bearer {access_token}
Required Role: ADMIN+
Content-Type: application/json

Request:
{
  "name": "Filtro de Aceite Yamaha R1 - Edición 2024",
  "price": 28.00,
  "stock": 25, // Esto genera un inventory_movement de tipo AJUSTE_MANUAL
  "threshold_low": 15
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    // ... producto actualizado
    "state": "DISPONIBLE" // Recalculado automáticamente por trigger
  }
}

Errors:
404 NOT_FOUND: Producto no existe
403 FORBIDDEN: Rol insuficiente o cross-tenant
400 NEGATIVE_STOCK: Stock negativo sin override
```

### 3.5 Eliminar Producto
```http
DELETE /api/v1/products/{id}
Authorization: Bearer {access_token}
Required Role: ADMIN+

Response: 204 No Content

Errors:
404 NOT_FOUND: Producto no existe
403 FORBIDDEN: Rol insuficiente
409 PRODUCT_HAS_SALES: Producto tiene ventas asociadas (no se puede eliminar)
```

### 3.6 Bloquear Producto
```http
POST /api/v1/products/{id}/block
Authorization: Bearer {access_token}
Required Role: ADMIN+
Content-Type: application/json

Request:
{
  "reason": "Producto defectuoso - Lote #12345 retirado del mercado"
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "is_blocked": true,
    "blocked_reason": "Producto defectuoso...",
    "blocked_at": "2026-02-13T15:30:00Z",
    "blocked_by": "uuid",
    "state": "BLOQUEADO"
  }
}

Errors:
404 NOT_FOUND: Producto no existe
403 FORBIDDEN: Rol insuficiente
400 ALREADY_BLOCKED: Producto ya está bloqueado
```

---

## 👥 4. Módulo: Clientes (CRM)

### 4.1 Listar Clientes
```http
GET /api/v1/customers?page=1&limit=50&status=active&search=juan
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+

Query Params:
- page, limit, search (igual que productos)
- status: 'active' | 'inactive' | 'lead'
- sort: 'name' | 'created_at' (default: 'name')

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "Juan Pérez", // Computed: first_name + last_name
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan.perez@example.com",
      "phone": "+57 300 1234567",
      "company_name": null,
      "tax_id": null,
      "address": "Calle 123 #45-67, Pereira",
      "status": "active",
      "notes": "Cliente VIP desde 2024",
      "created_at": "2024-06-15T10:00:00Z",
      "updated_at": "2026-02-10T12:00:00Z",
      "total_sales": 15, // Computed
      "total_spent": 1250.50 // Computed
    }
  ],
  "meta": {
    "total": 75,
    "page": 1,
    "limit": 50
  }
}
```

### 4.2 Crear Cliente
```http
POST /api/v1/customers
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+
Content-Type: application/json

Request:
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan.perez@example.com",
  "phone": "+57 300 1234567",
  "company_name": null, // Opcional
  "tax_id": null, // Opcional
  "address": "Calle 123 #45-67, Pereira",
  "notes": "Referido por María García"
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    // ... cliente completo
    "status": "lead" // Default
  }
}

Errors:
400 VALIDATION_ERROR: Email inválido
409 EMAIL_ALREADY_EXISTS: Email duplicado en tenant
409 QUOTA_EXCEEDED: Límite de clientes alcanzado
```

---

## 🛒 5. Módulo: Ventas

### 5.1 Crear Cotización
```http
POST /api/v1/sales
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+
Content-Type: application/json

Request:
{
  "customer_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 25.50, // Opcional, usa precio del producto si no se provee
      "discount": 0 // Opcional
    },
    {
      "product_id": "uuid-2",
      "quantity": 1,
      "unit_price": 150.00
    }
  ],
  "discount": 10.00, // Descuento global opcional
  "tax": 0, // Opcional
  "notes": "Entrega urgente para el viernes"
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "customer_id": "uuid",
    "customer": { /* datos del cliente */ },
    "created_by": "uuid",
    "state": "COTIZACIÓN",
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product_name": "Filtro de Aceite Yamaha R1",
        "product_sku": "YAMAHA-R1-FILTER-2020",
        "quantity": 2,
        "unit_price": 25.50,
        "subtotal": 51.00,
        "discount": 0
      },
      {
        "id": "uuid",
        "product_id": "uuid-2",
        "product_name": "Aceite Sintético 10W-40",
        "quantity": 1,
        "unit_price": 150.00,
        "subtotal": 150.00
      }
    ],
    "subtotal": 201.00,
    "discount": 10.00,
    "tax": 0,
    "total": 191.00,
    "payment_method": null,
    "is_override": false,
    "notes": "Entrega urgente para el viernes",
    "created_at": "2026-02-13T15:30:00Z",
    "updated_at": "2026-02-13T15:30:00Z"
  }
}

Errors:
400 VALIDATION_ERROR: Items vacíos o inválidos
404 CUSTOMER_NOT_FOUND: Cliente no existe
404 PRODUCT_NOT_FOUND: Producto no existe
400 PRODUCT_OUT_OF_STOCK: Stock insuficiente (solo warning en COTIZACIÓN)
409 QUOTA_EXCEEDED: Límite de ventas alcanzado
```

### 5.2 Aprobar Cotización (cambiar a PENDIENTE)
```http
PATCH /api/v1/sales/{id}/approve
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+ (configurable por tenant)

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "PENDIENTE",
    "approved_at": "2026-02-13T16:00:00Z"
  }
}

Errors:
404 NOT_FOUND: Venta no existe
400 INVALID_STATE_TRANSITION: Solo se puede aprobar desde COTIZACIÓN
400 PRODUCT_OUT_OF_STOCK: Stock insuficiente (bloqueante)
```

### 5.3 Confirmar Pago
```http
POST /api/v1/sales/{id}/confirm-payment
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+ (configurable)
Content-Type: application/json

Request:
{
  "payment_method": "cash" | "card" | "transfer" | "other"
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "PAGADO",
    "payment_method": "cash",
    "paid_at": "2026-02-13T16:30:00Z",
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product": {
          "stock": 13 // Stock actualizado después del pago
        }
      }
    ]
  }
}

Errors:
404 NOT_FOUND: Venta no existe
400 INVALID_STATE_TRANSITION: Solo desde PENDIENTE
400 NEGATIVE_STOCK_PREVENTED: Stock insuficiente (transacción abortada)
```

### 5.4 Override de Venta (sin stock)
```http
POST /api/v1/sales/override
Authorization: Bearer {access_token}
Required Role: ADMIN+
Content-Type: application/json
Idempotency-Key: {uuid}

Request:
{
  "customer_id": "uuid",
  "items": [ /* igual que crear venta */ ],
  "override_reason": "Cliente VIP urgente. Stock en camino mañana temprano. Aprobado por gerente."
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    // ... venta completa
    "is_override": true,
    "override_audit_id": "uuid",
    "state": "COTIZACIÓN"
  },
  "warning": "Venta creada con override. Productos con stock negativo."
}

Errors:
400 OVERRIDE_REASON_TOO_SHORT: Razón debe tener mínimo 10 caracteres
403 FORBIDDEN: Rol insuficiente
```

### 5.5 Marcar como Entregado
```http
PATCH /api/v1/sales/{id}/deliver
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "ENTREGADO",
    "delivered_at": "2026-02-14T10:00:00Z"
  }
}
```

---

## 📦 6. Módulo: Compras

### 6.1 Crear Orden de Compra
```http
POST /api/v1/purchase-orders
Authorization: Bearer {access_token}
Required Role: ADMIN+
Content-Type: application/json

Request:
{
  "supplier_name": "Distribuidora Yamaha S.A.",
  "supplier_email": "ventas@yamaha.com.co",
  "supplier_phone": "+57 1 234 5678",
  "items": [
    {
      "product_id": "uuid",
      "quantity_ordered": 50,
      "unit_cost": 20.00
    }
  ],
  "tax": 190.00,
  "notes": "Orden mensual de febrero"
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "supplier_name": "Distribuidora Yamaha S.A.",
    "state": "BORRADOR",
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product": { /* datos del producto */ },
        "quantity_ordered": 50,
        "quantity_received": 0,
        "unit_cost": 20.00,
        "subtotal": 1000.00
      }
    ],
    "subtotal": 1000.00,
    "tax": 190.00,
    "total": 1190.00,
    "created_by": "uuid",
    "created_at": "2026-02-13T15:30:00Z"
  }
}
```

### 6.2 Enviar Orden a Proveedor
```http
POST /api/v1/purchase-orders/{id}/send
Authorization: Bearer {access_token}
Required Role: ADMIN+

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "ENVIADA",
    "sent_at": "2026-02-13T16:00:00Z"
  }
}

Side Effect:
- Dispara automatización "PURCHASE_ORDER_SENT"
- Envía email al proveedor con PDF de la orden
```

### 6.3 Registrar Recepción
```http
POST /api/v1/purchase-orders/{id}/receive
Authorization: Bearer {access_token}
Required Role: ADMIN+ (o EMPLOYEE si configurado)
Content-Type: application/json

Request:
{
  "items": [
    {
      "purchase_order_item_id": "uuid",
      "quantity_received": 45 // Recepción parcial (ordenados: 50)
    }
  ]
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "RECIBIDA_PARCIAL", // o RECIBIDA_COMPLETA si todo llegó
    "received_at": "2026-02-15T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "quantity_ordered": 50,
        "quantity_received": 45,
        "product": {
          "stock": 60 // Stock actualizado (+45)
        }
      }
    ]
  }
}

Side Effect:
- Crea inventory_movements de tipo COMPRA
- Recalcula estado de productos (puede pasar de AGOTADO → DISPONIBLE)
- Dispara eventos product.state_changed si cambia
```

---

## 🔧 7. Módulo: Servicios (Taller Mecánico)

### 7.1 Crear Servicio
```http
POST /api/v1/services
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+
Content-Type: application/json

Request:
{
  "customer_id": "uuid",
  "vehicle_id": "uuid", // O crear vehículo inline
  "vehicle": { // Si vehicle_id es null
    "brand": "Yamaha",
    "model": "R1",
    "year": 2020,
    "plate": "ABC123",
    "color": "Azul"
  },
  "description": "Cambio de aceite y revisión de frenos",
  "labor_cost": 80000,
  "parts_cost": 0, // Se puede agregar después
  "notes": "Cliente reporta ruido en freno trasero"
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "customer_id": "uuid",
    "customer": { /* datos */ },
    "vehicle_id": "uuid",
    "vehicle": {
      "id": "uuid",
      "brand": "Yamaha",
      "model": "R1",
      "plate": "ABC123"
    },
    "state": "RECIBIDO",
    "description": "Cambio de aceite y revisión de frenos",
    "diagnosis": null,
    "labor_cost": 80000,
    "parts_cost": 0,
    "total_cost": 80000,
    "assigned_to": null,
    "received_at": "2026-02-13T15:30:00Z",
    "created_by": "uuid",
    "created_at": "2026-02-13T15:30:00Z"
  }
}

Side Effect:
- Dispara automatización "SERVICE_RECEIVED" (confirmación al cliente)
```

### 7.2 Asignar Técnico
```http
PATCH /api/v1/services/{id}/assign
Authorization: Bearer {access_token}
Required Role: ADMIN+
Content-Type: application/json

Request:
{
  "assigned_to": "uuid" // user_id del técnico
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "EN_PROCESO",
    "assigned_to": "uuid",
    "assigned_at": "2026-02-13T16:00:00Z",
    "started_at": "2026-02-13T16:00:00Z"
  }
}
```

### 7.3 Marcar como Reparado
```http
PATCH /api/v1/services/{id}/complete
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+ (técnico asignado o ADMIN+)
Content-Type: application/json

Request:
{
  "diagnosis": "Pastillas de freno trasero desgastadas. Reemplazadas.",
  "parts_cost": 120000 // Actualizar si hubo repuestos
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "REPARADO",
    "diagnosis": "Pastillas de freno...",
    "parts_cost": 120000,
    "total_cost": 200000,
    "completed_at": "2026-02-14T11:00:00Z"
  }
}

Side Effect: 🚨 CRÍTICO
- Dispara automatización "VEHICLE_READY" (WhatsApp al cliente)
- Programa recordatorio 24h si no hay respuesta
```

### 7.4 Marcar como Entregado
```http
PATCH /api/v1/services/{id}/deliver
Authorization: Bearer {access_token}
Required Role: EMPLOYEE+

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "state": "ENTREGADO",
    "delivered_at": "2026-02-15T09:00:00Z"
  }
}

Side Effect:
- Dispara automatización "SERVICE_DELIVERED" (solicitud de review)
```

---

## 🔔 8. Módulo: Automatizaciones

### 8.1 Listar Templates Disponibles
```http
GET /api/v1/automation-templates?industry_type=taller
Authorization: Bearer {access_token}
Required Role: ADMIN+

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "template_key": "VEHICLE_READY",
      "name": "Vehículo Listo para Retiro",
      "description": "Notifica al cliente...",
      "industry_type": "taller",
      "trigger_event": "service.state_changed",
      "trigger_condition": { "new_state": "REPARADO" },
      "message_template": "Hola {{cliente_nombre}}...",
      "allowed_variables": ["cliente_nombre", "vehiculo_marca", ...],
      "default_channel": "whatsapp",
      "priority": "CRITICAL"
    }
  ]
}
```

### 8.2 Activar Automatización
```http
POST /api/v1/tenant-automations
Authorization: Bearer {access_token}
Required Role: OWNER
Content-Type: application/json

Request:
{
  "template_id": "uuid",
  "is_active": true,
  "channel": "whatsapp",
  "config": {} // Parámetros específicos si aplica
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "template_id": "uuid",
    "template": { /* datos del template */ },
    "is_active": true,
    "channel": "whatsapp",
    "config": {}
  }
}
```

### 8.3 Ver Log de Ejecuciones
```http
GET /api/v1/automation-executions?page=1&status=SUCCESS
Authorization: Bearer {access_token}
Required Role: ADMIN+

Query Params:
- status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABORTED_MISSING_DATA' | 'SKIPPED_DUPLICATE'
- date_from, date_to

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "automation_id": "uuid",
      "automation": {
        "template": {
          "name": "Vehículo Listo para Retiro"
        }
      },
      "status": "SUCCESS",
      "channel": "whatsapp",
      "recipient": "+57 300 1234567",
      "message_sent": "Hola Juan, tu Yamaha R1...",
      "external_message_id": "wamid.ABC123...",
      "executed_at": "2026-02-14T11:05:00Z"
    }
  ],
  "meta": {
    "total": 450,
    "success_rate": 0.97 // 97% éxito
  }
}
```

---

## 🔐 9. Módulo: Auditoría

### 9.1 Ver Audit Log
```http
GET /api/v1/audit-logs?page=1&action=FORCE_SALE_NO_STOCK
Authorization: Bearer {access_token}
Required Role: OWNER

Query Params:
- action: string (filtro)
- user_id: uuid
- entity_type: 'product' | 'sale' | 'service'
- date_from, date_to

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "user_id": "uuid",
      "user": {
        "full_name": "Carlos Mendoza",
        "app_role": "ADMIN"
      },
      "action": "FORCE_SALE_NO_STOCK",
      "entity_type": "sale",
      "entity_id": "uuid",
      "old_data": {},
      "new_data": { /* datos de la venta */ },
      "ip_address": "192.168.1.100",
      "created_at": "2026-02-13T15:30:00Z"
    }
  ]
}
```

---

## ⚠️ 10. Códigos de Error Estándar

### Autenticación (4xx)
| Código | HTTP | Descripción |
|--------|------|-------------|
| UNAUTHORIZED | 401 | Token inválido o expirado |
| FORBIDDEN | 403 | Permisos insuficientes |
| FORBIDDEN_CROSS_TENANT | 403 | Intento de acceso a otro tenant |
| ACCOUNT_SUSPENDED | 403 | Cuenta suspendida |

### Validación (4xx)
| Código | HTTP | Descripción |
| VALIDATION_ERROR | 400 | Datos inválidos en request |
| NOT_FOUND | 404 | Recurso no existe |
| ALREADY_EXISTS | 409 | Recurso duplicado |
| INVALID_STATE_TRANSITION | 400 | Transición de estado no permitida |

### Negocio (4xx)
| Código | HTTP | Descripción |
| QUOTA_EXCEEDED | 409 | Límite del plan alcanzado |
| PRODUCT_OUT_OF_STOCK | 400 | Stock insuficiente |
| NEGATIVE_STOCK_PREVENTED | 400 | Stock negativo bloqueado |
| OVERRIDE_REASON_TOO_SHORT | 400 | Razón de override insuficiente |

### Rate Limiting (4xx)
| Código | HTTP | Descripción |
| RATE_LIMIT_EXCEEDED | 429 | Demasiadas requests |
| TOO_MANY_ATTEMPTS | 429 | Demasiados intentos fallidos |

### Servidor (5xx)
| Código | HTTP | Descripción |
| INTERNAL_SERVER_ERROR | 500 | Error interno del servidor |
| DATABASE_ERROR | 500 | Error de base de datos |
| EXTERNAL_SERVICE_ERROR | 502 | Error de servicio externo (WhatsApp, Email) |

---

## 🔢 11. Rate Limiting

### Límites Globales
- **Por Usuario:** 100 requests/minuto
- **Por Tenant:** 1000 requests/minuto
- **Endpoints de Login:** 5 intentos/minuto por IP

### Headers de Respuesta
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1645123456
```

### Respuesta cuando se excede
```http
HTTP 429 Too Many Requests

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 45 seconds.",
    "details": {
      "retry_after": 45
    }
  }
}
```

---

## 📚 12. Paginación

### Request
```http
GET /api/v1/products?page=2&limit=50
```

### Response
```json
{
  "data": [ /* items */ ],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 50,
    "total_pages": 3,
    "has_next": true,
    "has_prev": true
  }
}
```

---

## 🔄 13. Webhooks (Proveedores Externos)

### 13.1 Webhook de WhatsApp (Meta)
```http
POST /api/v1/webhooks/whatsapp
X-Hub-Signature-256: {signature}

Request:
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "statuses": [
              {
                "id": "wamid.ABC123",
                "status": "delivered" | "read" | "failed",
                "timestamp": "1645123456"
              }
            ]
          }
        }
      ]
    }
  ]
}

Response: 200 OK
{
  "success": true
}

Side Effect:
- Actualiza automation_executions.provider_response
```

---

## 📖 14. Versionado de API

### Estrategia
- Versionado en URL: `/api/v1`, `/api/v2`
- Mantener 2 versiones en paralelo
- Deprecation warnings en headers:
  ```http
  Deprecation: version="v1"; sunset="2027-01-01"
  Sunset: Sat, 01 Jan 2027 00:00:00 GMT
  ```

---

---

## 💳 15. Módulo: Pagos (MercadoPago)

Este módulo gestiona la integración con la pasarerla de pagos para la suscripción de tenants y cobros operativos.

### 15.1 Webhook de Notificaciones
```http
POST /api/webhooks/mercadopago
Content-Type: application/json
X-Signature: {hmac_sha256} // Verificación de autenticidad

Request (MercadoPago Standard):
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "payment_id_123"
  },
  "date_created": "2026-03-22T15:30:00.000-04:00",
  "id": "event_id_456",
  "live_mode": true,
  "type": "payment",
  "user_id": "mp_user_id"
}

Response: 201 Created

Process Flow:
1. Validar firma del webhook (IPN).
2. Registrar evento en `webhook_events`.
3. Consultar detalle del pago vía SDK.
4. Actualizar tabla `payments` y disparar lógica de negocio (upgrade plan, etc).
```

### 15.2 Consultar Estado de Pago
```http
GET /api/v1/payments/{payment_id}
Authorization: Bearer {access_token}
Required Role: OWNER+

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "external_id": "mp_123456",
    "amount": 150000.00,
    "status": "approved", // pending, approved, authorized, in_process, rejected, cancelled, refunded, charged_back
    "payment_method": "credit_card",
    "metadata": {
      "plan": "professional",
      "tenant_id": "uuid"
    },
    "created_at": "2026-03-22T15:30:00Z"
  }
}
```

---

## 🔐 16. Seguridad

### Headers Requeridos
```http
Authorization: Bearer {token}
Content-Type: application/json
X-Tenant-ID: {uuid} // Validación redundante
```

### Headers Recomendados
```http
Idempotency-Key: {uuid} // Para operaciones críticas (ventas, pagos)
X-Request-ID: {uuid} // Para trazabilidad
```

### CORS
```
Access-Control-Allow-Origin: https://app.smartbusiness.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

---

## 📚 Referencias

### Documentos Relacionados
- [DOMAIN_STATES.md](./DOMAIN_STATES.md) - Estados usados en endpoints
- [BUSINESS_FLOWS.md](./BUSINESS_FLOWS.md) - Flujos implementados por la API
- [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) - Roles requeridos
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Modelos de datos

### Herramientas de Desarrollo
- **Postman Collection:** [Descargar](./postman_collection.json)
- **OpenAPI Spec:** [Swagger](./openapi.yaml)
- **TypeScript SDK:** [@smartbusiness/sdk](https://npm.com)

---

**Estado**: ✅ **API Specification Completa**  
**Versión**: 1.1.0  
**Última Actualización**: 2026-03-22  
**Mantenedor**: Smart Business OS Core Team

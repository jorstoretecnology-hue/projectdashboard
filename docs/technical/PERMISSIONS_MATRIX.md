# 🔐 Matriz de Permisos (PERMISSIONS_MATRIX.md)

> Define roles, jerarquías de acceso y restricciones de acciones por módulo.

---

## 📐 1. Principios de Permisos

### Reglas de Oro
1. **Mínimo Privilegio**: Los usuarios solo tienen acceso a lo que necesitan para su función.
2. **Multi-tenancy Estricto**: Los permisos NUNCA permiten acceso cross-tenant.
3. **Jerarquía Clara**: Cada rol hereda permisos del rol inferior.
4. **Auditoría Obligatoria**: Acciones sensibles requieren registro inmutable.

### Jerarquía de Roles
```
SUPER_ADMIN (Anthropic/Sistema)
    ↓
OWNER (Dueño del Negocio)
    ↓
ADMIN (Gerente/Administrador)
    ↓
EMPLOYEE (Empleado Estándar)
    ↓
VIEWER (Solo Lectura)
```

---

## 👥 2. Definición de Roles

### SUPER_ADMIN (Nivel Sistema)
**Descripción**: Personal de Anthropic con acceso global para soporte técnico.

**Capacidades Especiales**:
- Acceso cross-tenant (solo para debugging/soporte)
- Ver logs de auditoría de todos los tenants
- Modificar configuración de billing
- Activar/desactivar features por tenant
- Impersonar usuarios para resolución de tickets

**Restricciones**:
- ❌ NO puede editar datos de negocio de clientes
- ❌ NO puede ver información sensible (contraseñas, tokens)
- ✅ Todas las acciones se registran en `super_admin_audit_log`

### OWNER (Dueño del Negocio)
**Descripción**: El propietario o CEO del negocio. Tiene control total de su tenant.

**Capacidades**:
- ✅ Crear/editar/eliminar usuarios
- ✅ Cambiar roles de usuarios
- ✅ Ver reportes financieros completos
- ✅ Configurar automatizaciones
- ✅ Editar información del tenant (nombre, logo, etc.)
- ✅ Override de reglas de negocio (con auditoría)
- ✅ Gestión de billing y suscripción
- ✅ Eliminar datos (productos, clientes, ventas)
- ✅ Exportar datos completos

**Restricciones**:
- ❌ NO puede acceder a datos de otros tenants
- ❌ NO puede cambiar su propio rol a inferior

### ADMIN (Gerente/Administrador)
**Descripción**: Manager o gerente del negocio con permisos operativos amplios.

**Capacidades**:
- ✅ Gestión completa de inventario
- ✅ Gestión completa de CRM (clientes)
- ✅ Crear/editar ventas y compras
- ✅ Ver reportes operativos
- ✅ Asignar tareas a empleados
- ✅ Override de stock crítico (con auditoría y notificación a Owner)
- ✅ Configurar automatizaciones (limitado)

**Restricciones**:
- ❌ NO puede crear/eliminar usuarios
- ❌ NO puede cambiar roles
- ❌ NO puede ver reportes de billing
- ❌ NO puede modificar configuración del tenant
- ❌ NO puede eliminar ventas completadas

### EMPLOYEE (Empleado Estándar)
**Descripción**: Vendedor, técnico o empleado operativo.

**Capacidades**:
- ✅ Ver inventario (solo lectura de precios si está habilitado)
- ✅ Registrar ventas (cotizaciones)
- ✅ Ver clientes
- ✅ Registrar nuevos clientes
- ✅ Actualizar estado de servicios (si aplica a su vertical)
- ✅ Ver sus propias ventas

**Restricciones**:
- ❌ NO puede editar precios
- ❌ NO puede eliminar productos
- ❌ NO puede hacer override de reglas
- ❌ NO puede ver ventas de otros empleados (configurable)
- ❌ NO puede modificar stock manualmente
- ❌ NO puede ver reportes financieros

### VIEWER (Solo Lectura)
**Descripción**: Rol para inversionistas, auditores o supervisores externos.

**Capacidades**:
- ✅ Ver dashboard principal
- ✅ Ver inventario (sin precios)
- ✅ Ver reportes públicos
- ✅ Ver estadísticas generales

**Restricciones**:
- ❌ NO puede crear/editar/eliminar nada
- ❌ NO puede ver información financiera sensible
- ❌ NO puede acceder a configuraciones

---

## 📊 3. Matriz de Permisos por Módulo

### 3.1 Dashboard

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Dashboard Principal | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Health Score | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Alertas Críticas | ✅ | ✅ | ✅ | ⚠️ Solo asignadas a él | ❌ |
| Ver Métricas Financieras | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configurar Widgets | ✅ | ✅ | ✅ | ❌ | ❌ |

### 3.2 Inventario (Productos)

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Lista de Productos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Precios | ✅ | ✅ | ✅ | ⚠️ Configurable | ❌ |
| Crear Producto | ✅ | ✅ | ✅ | ❌ | ❌ |
| Editar Producto | ✅ | ✅ | ✅ | ❌ | ❌ |
| Editar Precio | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eliminar Producto | ✅ | ✅ | ⚠️ Solo si no tiene ventas | ❌ | ❌ |
| Ajustar Stock Manualmente | ✅ | ✅ | ✅ | ❌ | ❌ |
| Override Stock Negativo | ✅ | ✅ | ⚠️ Con auditoría | ❌ | ❌ |
| Ver Movimientos de Stock | ✅ | ✅ | ✅ | ✅ | ❌ |
| Bloquear Producto | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exportar Inventario | ✅ | ✅ | ✅ | ❌ | ❌ |

### 3.3 CRM (Clientes)

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Clientes | ✅ | ✅ | ✅ | ✅ | ⚠️ Solo datos públicos |
| Ver Historial de Compras | ✅ | ✅ | ✅ | ⚠️ Solo sus propias ventas | ❌ |
| Crear Cliente | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editar Cliente | ✅ | ✅ | ✅ | ✅ | ❌ |
| Eliminar Cliente | ✅ | ✅ | ⚠️ Solo si no tiene ventas | ❌ | ❌ |
| Ver Datos Sensibles (email, teléfono) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Exportar Lista de Clientes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Fusionar Clientes Duplicados | ✅ | ✅ | ✅ | ❌ | ❌ |

### 3.4 Ventas

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Ventas | ✅ | ✅ | ✅ | ⚠️ Solo propias | ⚠️ Solo totales |
| Crear Cotización | ✅ | ✅ | ✅ | ✅ | ❌ |
| Aprobar Cotización | ✅ | ✅ | ✅ | ⚠️ Configurable | ❌ |
| Confirmar Pago | ✅ | ✅ | ✅ | ⚠️ Configurable | ❌ |
| Marcar Entregado | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editar Venta (antes de pago) | ✅ | ✅ | ✅ | ⚠️ Solo propias | ❌ |
| Eliminar Venta | ✅ | ✅ | ⚠️ Solo COTIZACIÓN o CANCELADA | ❌ | ❌ |
| Cancelar Venta | ✅ | ✅ | ✅ | ❌ | ❌ |
| Aplicar Descuento | ✅ | ✅ | ✅ | ⚠️ Hasta 10% | ❌ |
| Override Venta sin Stock | ✅ | ✅ | ⚠️ Con auditoría | ❌ | ❌ |
| Ver Reporte de Ventas | ✅ | ✅ | ✅ | ⚠️ Solo propias | ❌ |

### 3.5 Compras (Purchase Orders)

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Órdenes de Compra | ✅ | ✅ | ✅ | ❌ | ❌ |
| Crear Orden de Compra | ✅ | ✅ | ✅ | ❌ | ❌ |
| Enviar Orden a Proveedor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marcar como Confirmada | ✅ | ✅ | ✅ | ❌ | ❌ |
| Registrar Recepción | ✅ | ✅ | ✅ | ⚠️ Configurable | ❌ |
| Editar Orden (solo BORRADOR) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cancelar Orden | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver Costos | ✅ | ✅ | ✅ | ❌ | ❌ |

### 3.6 Servicios (Taller Mecánico)

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Servicios | ✅ | ✅ | ✅ | ⚠️ Solo asignados | ⚠️ Solo totales |
| Crear Servicio | ✅ | ✅ | ✅ | ✅ | ❌ |
| Asignar Técnico | ✅ | ✅ | ✅ | ❌ | ❌ |
| Actualizar Estado | ✅ | ✅ | ✅ | ⚠️ Solo asignados | ❌ |
| Marcar como Reparado | ✅ | ✅ | ✅ | ⚠️ Solo asignados | ❌ |
| Marcar como Entregado | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver Costos/Repuestos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Editar Costo Final | ✅ | ✅ | ✅ | ❌ | ❌ |

### 3.7 Automatizaciones

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Plantillas Disponibles | ✅ | ✅ | ✅ | ❌ | ❌ |
| Activar/Desactivar Automatización | ✅ | ✅ | ⚠️ Limitado | ❌ | ❌ |
| Configurar Parámetros | ✅ | ✅ | ⚠️ Limitado | ❌ | ❌ |
| Cambiar Canal (WhatsApp/Email) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver Log de Ejecuciones | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reenviar Mensaje Fallido | ✅ | ✅ | ✅ | ❌ | ❌ |
| Crear Plantilla Custom | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.8 Configuración del Tenant

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Configuración | ✅ | ✅ | ⚠️ Limitado | ❌ | ❌ |
| Editar Nombre/Logo | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cambiar Plan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar Billing | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver API Keys | ✅ | ✅ | ❌ | ❌ | ❌ |
| Regenerar API Keys | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configurar Integraciones (Meta, Resend) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Exportar Todos los Datos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Eliminar Tenant | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.9 Usuarios y Roles

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Usuarios del Tenant | ✅ | ✅ | ✅ | ❌ | ❌ |
| Crear Usuario | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar Usuario | ✅ | ✅ | ❌ | ❌ | ❌ |
| Eliminar Usuario | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cambiar Rol | ✅ | ✅ | ❌ | ❌ | ❌ |
| Resetear Contraseña | ✅ | ✅ | ❌ | ⚠️ Solo propia | ❌ |
| Ver Log de Actividad de Usuario | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suspender Usuario | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.10 Auditoría

| Acción | SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | VIEWER |
|--------|-------------|-------|-------|----------|--------|
| Ver Audit Log Completo | ✅ | ✅ | ⚠️ Limitado | ❌ | ❌ |
| Ver Overrides Realizados | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver Cambios de Estado | ✅ | ✅ | ✅ | ⚠️ Solo propios | ❌ |
| Exportar Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver Quién Vio Qué (Privacy Log) | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 4. Permisos Especiales por Industria

### 4.1 Taller Mecánico - Permisos Adicionales

| Acción | OWNER | ADMIN | TÉCNICO | RECEPCIONISTA |
|--------|-------|-------|---------|---------------|
| Registrar Ingreso de Vehículo | ✅ | ✅ | ❌ | ✅ |
| Asignar Técnico | ✅ | ✅ | ❌ | ✅ |
| Actualizar Estado Servicio | ✅ | ✅ | ⚠️ Solo asignados | ❌ |
| Marcar como Reparado | ✅ | ✅ | ⚠️ Solo asignados | ❌ |
| Marcar como Entregado | ✅ | ✅ | ❌ | ✅ |
| Agregar Repuestos | ✅ | ✅ | ✅ | ❌ |
| Editar Costo Final | ✅ | ✅ | ❌ | ❌ |

### 4.2 Restaurante - Permisos Adicionales

| Acción | OWNER | ADMIN | CHEF | MESERO |
|--------|-------|-------|------|--------|
| Ver Menú | ✅ | ✅ | ✅ | ✅ |
| Editar Menú | ✅ | ✅ | ⚠️ Solo precios | ❌ |
| Crear Pedido | ✅ | ✅ | ❌ | ✅ |
| Marcar Plato Preparado | ✅ | ✅ | ✅ | ❌ |
| Marcar Pedido Servido | ✅ | ✅ | ❌ | ✅ |
| Aplicar Descuento | ✅ | ✅ | ❌ | ⚠️ Hasta 5% |

### 4.3 Gimnasio - Permisos Adicionales

| Acción | OWNER | ADMIN | ENTRENADOR | RECEPCIONISTA |
|--------|-------|-------|------------|---------------|
| Ver Membresías | ✅ | ✅ | ⚠️ Solo clientes asignados | ✅ |
| Crear Membresía | ✅ | ✅ | ❌ | ✅ |
| Asignar Entrenador | ✅ | ✅ | ❌ | ✅ |
| Registrar Asistencia | ✅ | ✅ | ✅ | ✅ |
| Ver Rutinas de Clientes | ✅ | ✅ | ⚠️ Solo asignados | ❌ |
| Editar Rutinas | ✅ | ✅ | ⚠️ Solo asignados | ❌ |

---

## 🔒 5. Implementación Técnica de Permisos

### 5.1 Guards en NestJS

```typescript
// Guard para verificar rol mínimo requerido
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Verificar jerarquía de roles
    return this.checkRoleHierarchy(user.role, requiredRoles);
  }

  private checkRoleHierarchy(userRole: Role, requiredRoles: Role[]): boolean {
    const hierarchy = {
      SUPER_ADMIN: 5,
      OWNER: 4,
      ADMIN: 3,
      EMPLOYEE: 2,
      VIEWER: 1,
    };

    const userLevel = hierarchy[userRole];
    const minRequiredLevel = Math.min(
      ...requiredRoles.map(role => hierarchy[role])
    );

    return userLevel >= minRequiredLevel;
  }
}

// Uso en controllers
@Controller('sales')
export class SalesController {
  @Post('override')
  @Roles('ADMIN', 'OWNER')
  @AuditAction('FORCE_SALE_NO_STOCK')
  async createOverride(@Body() data: CreateSaleDTO) {
    // ...
  }
}
```

### 5.2 RLS Policies en Supabase

```sql
-- Policy: Solo el tenant puede ver sus propios datos
CREATE POLICY tenant_isolation_policy ON products
FOR ALL
USING (tenant_id = auth.uid()::text::uuid);

-- Policy: SUPER_ADMIN puede ver todo (para soporte)
CREATE POLICY super_admin_access ON products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
  )
);

-- Policy: Solo OWNER puede eliminar productos
CREATE POLICY owner_delete_products ON products
FOR DELETE
USING (
  tenant_id = auth.uid()::text::uuid
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND tenant_id = products.tenant_id
    AND role IN ('OWNER', 'SUPER_ADMIN')
  )
);
```

### 5.3 Decorador de Permisos Customizado

```typescript
// Decorador para permisos granulares
export function RequirePermission(resource: string, action: string) {
  return applyDecorators(
    SetMetadata('permission', { resource, action }),
    UseGuards(PermissionGuard)
  );
}

// Guard de permisos
@Injectable()
export class PermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { resource, action } = this.reflector.get('permission', context.getHandler());
    const { user } = context.switchToHttp().getRequest();

    // Consultar matriz de permisos
    const hasPermission = await this.permissionService.check(
      user.role,
      resource,
      action,
      user.tenant_id
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Rol ${user.role} no tiene permiso para ${action} en ${resource}`
      );
    }

    return true;
  }
}

// Uso
@Post('products')
@RequirePermission('inventory', 'create')
async createProduct(@Body() data: CreateProductDTO) {
  // ...
}
```

---

## 🎯 6. Casos de Uso de Permisos

### Caso 1: Vendedor Intenta Editar Precio
```typescript
// Request
POST /api/products/123
Headers: { Authorization: "Bearer <employee_token>" }
Body: { price: 150.00 }

// Response
HTTP 403 Forbidden
{
  "error": "FORBIDDEN",
  "message": "Rol EMPLOYEE no tiene permiso para edit_price en inventory",
  "required_role": "ADMIN"
}
```

### Caso 2: Admin Intenta Hacer Override con Auditoría
```typescript
// Request
POST /api/sales/override
Headers: { Authorization: "Bearer <admin_token>" }
Body: {
  product_id: "abc-123",
  quantity: 5,
  override_reason: "Cliente VIP, llega stock mañana"
}

// Flujo Interno
1. Verificar rol ADMIN ✅
2. Registrar en audit_log (ANTES de ejecutar)
3. Crear venta
4. Enviar email a OWNER con detalle del override
5. Marcar venta con flag is_override: true

// Response
HTTP 201 Created
{
  "sale_id": "xyz-789",
  "warning": "Override registrado. Stock negativo.",
  "audit_id": "audit-456"
}
```

### Caso 3: Employee Intenta Ver Venta de Otro Vendedor
```typescript
// Request
GET /api/sales/xyz-789
Headers: { Authorization: "Bearer <employee_token>" }

// Validación
const sale = await db.sales.findById('xyz-789');

if (sale.created_by !== currentUser.id && currentUser.role === 'EMPLOYEE') {
  throw new ForbiddenException('Solo puedes ver tus propias ventas');
}

// Configuración opcional en tenant
if (tenant.settings.employees_can_see_all_sales) {
  // Permitir acceso
}
```

---

## 📊 7. Dashboard de Permisos (Admin UI)

### Vista de Gestión de Roles
```typescript
interface RoleManagementView {
  tenant_id: string;
  users: {
    id: string;
    name: string;
    email: string;
    role: Role;
    last_login: Date;
    actions_last_24h: number;
  }[];
  role_distribution: {
    OWNER: number;
    ADMIN: number;
    EMPLOYEE: number;
    VIEWER: number;
  };
  pending_invitations: {
    email: string;
    invited_role: Role;
    expires_at: Date;
  }[];
  recent_permission_denials: {
    user: string;
    attempted_action: string;
    timestamp: Date;
  }[];
}
```

---

## 🔐 8. Auditoría de Permisos

### Log de Intentos de Acceso Denegado
```sql
CREATE TABLE permission_denials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    required_role VARCHAR(50) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para alertas de seguridad
CREATE INDEX idx_permission_denials_user ON permission_denials(user_id, created_at DESC);
```

### Alerta de Intentos Sospechosos
```typescript
@Injectable()
export class SecurityMonitorService {
  @Cron('*/5 * * * *') // Cada 5 minutos
  async checkSuspiciousActivity() {
    // Detectar usuarios con > 10 denials en 5 minutos
    const suspiciousUsers = await this.db.query(`
      SELECT user_id, COUNT(*) as denials
      FROM permission_denials
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      GROUP BY user_id
      HAVING COUNT(*) > 10
    `);

    for (const { user_id, denials } of suspiciousUsers) {
      await this.alertService.sendSecurityAlert({
        severity: 'HIGH',
        message: `Usuario ${user_id} tiene ${denials} denials de permiso en 5 min`,
        action: 'REVIEW_USER_ACTIVITY'
      });
    }
  }
}
```

---

## 📚 Referencias

### Documentos Relacionados
- [DOMAIN_STATES.md](./DOMAIN_STATES.md) - Estados que restringen acciones
- [BUSINESS_FLOWS.md](./BUSINESS_FLOWS.md) - Flujos que requieren permisos
- [MODULE_BLUEPRINT.md](./MODULE_BLUEPRINT.md) - Patrón de implementación de guards

### Implementación Técnica
- **NestJS Guards**: Para verificación de roles
- **Supabase RLS**: Para aislamiento en base de datos
- **Decorator Pattern**: Para permisos granulares

---

**Estado**: ✅ **Matriz de Permisos Completa**  
**Versión**: 1.0.0  
**Última Actualización**: 2026-02-13  
**Mantenedor**: Smart Business OS Core Team

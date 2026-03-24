# 🔐 Checklist de Seguridad (SECURITY_CHECKLIST.md)

> Lista exhaustiva de medidas de seguridad para proteger el Smart Business OS y los datos de los clientes.

---

## 📐 1. Principios de Seguridad

### Security by Design
1. **Mínimo Privilegio**: Usuarios solo tienen acceso a lo necesario
2. **Defense in Depth**: Múltiples capas de protección
3. **Fail Secure**: Si algo falla, falla de forma segura
4. **Zero Trust**: Verificar todo, no asumir nada
5. **Auditoría Total**: Registrar toda acción sensible

---

## 🔐 2. Autenticación y Autorización

### ✅ 2.1 Autenticación

- [ ] **JWT con RS256** (no HS256)
  - [ ] Tokens firmados con clave privada RSA
  - [ ] Tokens verificados con clave pública
  - [ ] Rotación de claves cada 90 días

- [ ] **Refresh Tokens**
  - [ ] Access token expira en 24h
  - [ ] Refresh token expira en 30 días
  - [ ] Refresh tokens almacenados hasheados en DB
  - [ ] Revocación de refresh tokens

- [ ] **Password Security**
  - [ ] Bcrypt con salt rounds >= 12
  - [ ] Mínimo 8 caracteres
  - [ ] Requiere: mayúscula, minúscula, número, símbolo especial
  - [ ] No permitir contraseñas comunes (lista de 10k más usadas)
  - [ ] Historial de contraseñas (no permitir últimas 5)

- [ ] **Rate Limiting en Login**
  - [ ] Máximo 5 intentos por IP cada 15 minutos
  - [ ] Bloqueo temporal de cuenta después de 10 intentos fallidos
  - [ ] CAPTCHA después de 3 intentos fallidos

- [ ] **MFA (Futuro - Fase 2)**
  - [ ] TOTP (Time-based One-Time Password)
  - [ ] SMS como backup
  - [ ] Obligatorio para OWNER
  - [ ] Opcional para otros roles

### ✅ 2.2 Autorización

- [x] **Row Level Security (RLS) en Supabase**
  - [x] Política de aislamiento por tenant en TODAS las tablas (Fase 1 Audit ✅)
  - [ ] Política de SUPER_ADMIN con logging
  - [x] Tests manuales de cross-tenant access verificados ✅

- [ ] **Role-Based Access Control (RBAC)**
  - [ ] Guards de NestJS en cada endpoint sensible
  - [ ] Jerarquía de roles verificada
  - [ ] Logging de intentos de acceso denegados

- [ ] **Tenant Context Validation**
  - [ ] Verificar tenant_id en cada request
  - [ ] Header X-Tenant-ID debe coincidir con el del token
  - [ ] Abortar request si hay mismatch

```typescript
// Ejemplo de Guard
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantIdFromHeader = request.headers['x-tenant-id'];
    
    // SUPER_ADMIN puede acceder a cualquier tenant (con logging)
    if (user.role === 'SUPER_ADMIN') {
      this.auditService.logSuperAdminAccess(user.id, tenantIdFromHeader);
      return true;
    }
    
    // Otros roles solo su tenant
    if (user.tenant_id !== tenantIdFromHeader) {
      this.auditService.logCrossTenantAttempt(user.id, tenantIdFromHeader);
      throw new ForbiddenException('Cross-tenant access denied');
    }
    
    return true;
  }
}
```

---

## 🛡️ 3. Protección de Datos

### ✅ 3.1 Datos en Tránsito

- [ ] **HTTPS Obligatorio**
  - [ ] Certificado SSL/TLS válido (Let's Encrypt o superior)
  - [ ] TLS 1.2 o superior
  - [ ] HSTS header habilitado
  - [ ] Redirect automático de HTTP a HTTPS

- [ ] **Secure Headers**
```typescript
// NestJS Helmet middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));
```

### ✅ 3.2 Datos en Reposo

- [ ] **Encriptación de Secretos**
  - [ ] API keys de proveedores encriptadas con AES-256-GCM
  - [ ] Encryption keys en AWS Secrets Manager / Vault
  - [ ] NUNCA en código fuente o .env público

- [ ] **Encriptación de DB (Supabase)**
  - [ ] Encriptación at-rest habilitada (por defecto en Supabase)
  - [ ] Backups encriptados

- [ ] **PII (Personally Identifiable Information)**
  - [ ] Emails de clientes: encriptados o hasheados para búsqueda
  - [ ] Teléfonos: encriptados
  - [ ] Direcciones: texto plano (necesario para facturación)

```typescript
// Ejemplo de campo encriptado
import { encrypt, decrypt } from './crypto.util';

@Column({ type: 'text' })
private _phone: string;

get phone(): string {
  return decrypt(this._phone);
}

set phone(value: string) {
  this._phone = encrypt(value);
}
```

### ✅ 3.3 Datos Sensibles en Logs

- [ ] **Sanitización de Logs**
  - [ ] NO loggear contraseñas (obvio)
  - [ ] NO loggear tokens completos (solo últimos 4 caracteres)
  - [ ] NO loggear emails completos en producción (usar hash)
  - [ ] NO loggear números de tarjeta
  - [ ] NO loggear API keys

```typescript
// Logger personalizado
const sanitize = (obj: any) => {
  const sanitized = { ...obj };
  
  if (sanitized.password) sanitized.password = '***REDACTED***';
  if (sanitized.token) sanitized.token = `***${sanitized.token.slice(-4)}`;
  if (sanitized.email) sanitized.email = hashEmail(sanitized.email);
  
  return sanitized;
};

logger.info('User login', sanitize(loginData));
```

---

## 🚫 4. OWASP Top 10

### ✅ 4.1 Injection (SQL, NoSQL, Command)

- [x] **Parameterized Queries**
  - [x] Usar ORM (Prisma/TypeORM) / Supabase Client siempre ✅
  - [x] NUNCA concatenar strings para queries ✅
  - [x] Validar input con Zod antes de queries (Fase 2 Audit ✅)

- [ ] **Input Validation**
```typescript
// Zod schema para validación
const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  sku: z.string().regex(/^[A-Z0-9-]+$/), // Solo alfanuméricos y guiones
});

// Validación en DTO
export class CreateProductDTO {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;
  
  @IsNumber()
  @Min(0.01)
  price: number;
  
  @Matches(/^[A-Z0-9-]+$/)
  sku: string;
}
```

### ✅ 4.2 Broken Authentication

- [ ] **Session Management**
  - [ ] Tokens almacenados en HttpOnly cookies (no localStorage)
  - [ ] SameSite=Strict en cookies
  - [ ] Secure flag en cookies (solo HTTPS)
  - [ ] Logout invalida el token en servidor

```typescript
// Cookie segura
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: true, // Solo HTTPS
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
});
```

### ✅ 4.3 Sensitive Data Exposure

- [ ] **No exponer información innecesaria**
  - [ ] NO devolver contraseñas en responses (aunque estén hasheadas)
  - [ ] NO devolver tokens internos
  - [ ] NO devolver IDs de otros tenants en errores
  - [ ] NO mostrar stack traces en producción

```typescript
// Exception filter personalizado
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;
    
    // En producción, NO mostrar detalles internos
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : exception.message;
    
    response.status(status).json({
      error: {
        code: exception.code || 'INTERNAL_ERROR',
        message: message,
        // NO incluir: stack, path, timestamp detallado
      },
      meta: {
        request_id: request.id
      }
    });
    
    // Loggear el error completo internamente
    this.logger.error(exception);
  }
}
```

### ✅ 4.4 XML External Entities (XXE)

- [ ] **Deshabilitar entidades externas en parsers XML**
  - [ ] Usar librerías modernas que lo deshabilitan por defecto
  - [ ] Validar XML contra schema estricto

### ✅ 4.5 Broken Access Control

- [ ] **Verificación de Ownership**
```typescript
// Antes de editar un recurso
const product = await productService.findById(id);

if (product.tenant_id !== user.tenant_id) {
  throw new ForbiddenException('Cross-tenant access denied');
}

// Proceder con la edición
```

- [x] **IDOR Prevention (Insecure Direct Object Reference)**
  - [x] NO usar IDs secuenciales (usar UUIDs everywhere ✅)
  - [x] Siempre verificar ownership antes de operaciones (getRequiredTenantId ✅)
  - [x] Verificación manual de IDOR en Server Actions ✅

### ✅ 4.6 Security Misconfiguration

- [ ] **Variables de Entorno**
  - [ ] Archivo .env NO en git (.gitignore)
  - [ ] Secretos en AWS Secrets Manager / Vercel Env
  - [ ] Diferentes .env por ambiente (dev, staging, prod)

- [ ] **Defaults Seguros**
  - [ ] Cambiar contraseñas default de admin
  - [ ] Deshabilitar endpoints de debug en producción
  - [ ] Deshabilitar CORS para dominios no autorizados

```typescript
// CORS configurado correctamente
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://app.smartbusiness.com']
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
});
```

### ✅ 4.7 XSS (Cross-Site Scripting)

- [ ] **Sanitización de Output**
  - [ ] Usar React (escapa por defecto)
  - [ ] NO usar dangerouslySetInnerHTML sin sanitizar
  - [ ] Sanitizar HTML con DOMPurify si es necesario

```typescript
import DOMPurify from 'dompurify';

// Si REALMENTE necesitas renderizar HTML del usuario
const safeHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'p'],
  ALLOWED_ATTR: []
});
```

- [ ] **Content Security Policy (CSP)**
  - [ ] Header CSP estricto
  - [ ] NO inline scripts
  - [ ] NO eval()

### ✅ 4.8 Insecure Deserialization

- [ ] **Validación de JSON Input**
  - [ ] NO usar JSON.parse directamente en input de usuario
  - [ ] Validar estructura con Zod antes de procesar
  - [ ] Límite de tamaño de payload (100KB para APIs)

```typescript
// Middleware de tamaño de body
app.use(express.json({ limit: '100kb' }));
```

### ✅ 4.9 Using Components with Known Vulnerabilities

- [ ] **Dependencias Actualizadas**
  - [ ] npm audit cada semana
  - [ ] Dependabot habilitado en GitHub
  - [ ] Actualizar dependencias críticas inmediatamente
  - [ ] No usar paquetes deprecated

```bash
# En CI/CD
npm audit --audit-level=high
# Si hay vulnerabilidades high/critical, fallar el build
```

### ✅ 4.10 Insufficient Logging & Monitoring

- [ ] **Logging Completo**
  - [ ] Loggear todos los intentos de login (éxito y fallo)
  - [ ] Loggear todos los cambios de permisos
  - [ ] Loggear todos los overrides de reglas
  - [ ] Loggear todos los errores 500

- [ ] **Alertas en Tiempo Real**
  - [ ] Sentry para errores críticos
  - [ ] Alerta si > 10 intentos de login fallidos en 5 min
  - [ ] Alerta si rate limit se excede frecuentemente

---

## 🔒 5. Multi-Tenancy Security

### ✅ 5.1 Aislamiento Estricto

- [ ] **RLS en TODAS las tablas**
```sql
-- Política estándar
CREATE POLICY tenant_isolation ON {table_name}
  FOR ALL USING (tenant_id = auth.uid()::text::uuid);

-- Test de aislamiento
-- Intentar acceder a datos de otro tenant debe fallar
SELECT * FROM products WHERE tenant_id = 'otro-tenant-id';
-- Resultado esperado: 0 filas (gracias a RLS)
```

- [ ] **Tests de Cross-Tenant**
```typescript
describe('Cross-Tenant Security', () => {
  it('should not allow user from tenant A to access tenant B data', async () => {
    const tenantAUser = await loginAs('user-tenant-a');
    const tenantBProduct = await createProductInTenantB();
    
    const response = await request(app)
      .get(`/api/v1/products/${tenantBProduct.id}`)
      .set('Authorization', `Bearer ${tenantAUser.token}`)
      .set('X-Tenant-ID', tenantBProduct.tenant_id);
    
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN_CROSS_TENANT');
  });
});
```

### ✅ 5.2 Quota Enforcement

- [ ] **Validación antes de crear recursos**
```typescript
// Antes de crear producto
const currentCount = await productService.count(tenantId);
const quota = await quotaService.getLimit(tenantId, 'products');

if (currentCount >= quota) {
  throw new QuotaExceededException({
    resource: 'products',
    current: currentCount,
    limit: quota
  });
}
```

---

## 🚨 6. Rate Limiting

### ✅ 6.1 Rate Limits por Endpoint

```typescript
import rateLimit from 'express-rate-limit';

// Rate limit general
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

// Rate limit estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  skipSuccessfulRequests: true, // Solo contar fallos
});

// Aplicar
app.use('/api', generalLimiter);
app.use('/api/v1/auth/login', loginLimiter);
```

### ✅ 6.2 DDoS Protection

- [ ] **Cloudflare / Vercel Protection**
  - [ ] WAF (Web Application Firewall)
  - [ ] Bot detection
  - [ ] Challenge pages para IPs sospechosas

---

## 🔍 7. Auditoría y Compliance

### ✅ 7.1 Audit Logging

- [ ] **Eventos Auditados**
```typescript
const AUDITED_ACTIONS = [
  // Autenticación
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_RESET',
  
  // Autorización
  'PERMISSION_DENIED',
  'ROLE_CHANGED',
  
  // Datos sensibles
  'PRODUCT_CREATED',
  'PRODUCT_DELETED',
  'CUSTOMER_CREATED',
  'CUSTOMER_DELETED',
  'SALE_CREATED',
  'SALE_OVERRIDE',
  
  // Configuración
  'TENANT_SETTINGS_CHANGED',
  'INTEGRATION_CONFIGURED',
  'AUTOMATION_ACTIVATED',
];
```

- [ ] **Retención de Logs**
  - [ ] Logs de auditoría: 7 años (compliance fiscal)
  - [ ] Logs de aplicación: 90 días
  - [ ] Logs de errores: 1 año

### ✅ 7.2 GDPR / CCPA Compliance

- [ ] **Derecho al Olvido**
  - [ ] Endpoint para eliminar todos los datos de un cliente
  - [ ] Proceso de anonimización de datos en auditoría
  - [ ] Confirmación por email antes de eliminación

```typescript
@Delete('customers/:id/gdpr-delete')
async gdprDelete(@Param('id') id: string, @User() user: UserEntity) {
  // 1. Verificar ownership
  const customer = await this.customerService.findById(id);
  if (customer.tenant_id !== user.tenant_id) throw new ForbiddenException();
  
  // 2. Anonimizar en lugar de eliminar (para mantener integridad de ventas)
  await this.customerService.anonymize(id);
  
  // 3. Log de acción
  await this.auditService.log({
    action: 'GDPR_DELETE_REQUEST',
    user_id: user.id,
    entity_type: 'customer',
    entity_id: id
  });
  
  return { success: true };
}
```

- [ ] **Portabilidad de Datos**
  - [ ] Endpoint para exportar todos los datos de un tenant
  - [ ] Formato JSON / CSV
  - [ ] Incluir todas las tablas relacionadas

---

## 🧪 8. Testing de Seguridad

### ✅ 8.1 Automated Security Tests

```typescript
// Test de SQL Injection
it('should prevent SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE products; --";
  
  const response = await request(app)
    .get(`/api/v1/products?search=${encodeURIComponent(maliciousInput)}`)
    .set('Authorization', validToken);
  
  // No debe causar error de SQL
  expect(response.status).not.toBe(500);
  
  // Tabla debe seguir existiendo
  const products = await db.products.findMany();
  expect(products).toBeDefined();
});

// Test de XSS
it('should sanitize XSS in product name', async () => {
  const xssInput = '<script>alert("XSS")</script>';
  
  const response = await request(app)
    .post('/api/v1/products')
    .set('Authorization', adminToken)
    .send({ name: xssInput, price: 100, stock: 10 });
  
  expect(response.status).toBe(201);
  
  // Verificar que se sanitizó
  const product = await db.products.findById(response.body.data.id);
  expect(product.name).not.toContain('<script>');
});
```

### ✅ 8.2 Penetration Testing

- [ ] **Contratar Pentest cada 6 meses**
  - [ ] OWASP Top 10
  - [ ] Pruebas de cross-tenant
  - [ ] Pruebas de escalación de privilegios

---

## 📋 9. Checklist Pre-Production

Antes de lanzar a producción, verificar:

### Autenticación
- [ ] JWT con RS256 implementado
- [ ] Refresh tokens funcionando
- [ ] Rate limiting en login activo
- [ ] Passwords con bcrypt (12 rounds)

### Autorización
- [ ] RLS habilitado en TODAS las tablas
- [ ] Guards de NestJS en endpoints sensibles
- [ ] Tests de cross-tenant passing

### Encriptación
- [ ] HTTPS obligatorio
- [ ] Certificado SSL válido
- [ ] API keys encriptadas
- [ ] Secure headers (Helmet)

### OWASP
- [ ] Input validation con Zod
- [ ] Output sanitization
- [ ] CSP configurado
- [ ] CORS restringido

### Logging
- [ ] Sentry configurado
- [ ] Audit logging activo
- [ ] Logs sanitizados (no PII)
- [ ] Alertas críticas configuradas

### Compliance
- [ ] Política de privacidad publicada
- [ ] Términos de servicio publicados
- [ ] GDPR delete endpoint implementado
- [ ] Data export endpoint implementado

---

## 🚨 10. Incident Response Plan

### En caso de breach de seguridad:

1. **Contención (0-1h)**
   - [ ] Revocar todos los tokens activos
   - [ ] Bloquear IP del atacante
   - [ ] Rotar API keys comprometidas

2. **Investigación (1-4h)**
   - [ ] Revisar audit logs
   - [ ] Identificar scope del ataque
   - [ ] Determinar qué datos fueron accedidos

3. **Notificación (4-24h)**
   - [ ] Notificar a tenants afectados
   - [ ] Notificar a autoridades si es requerido (GDPR)
   - [ ] Publicar post-mortem

4. **Remediación (1-7 días)**
   - [ ] Patchear vulnerabilidad
   - [ ] Forzar reset de contraseñas
   - [ ] Actualizar documentación

---

## 📚 Referencias

### Estándares de Seguridad
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Top 25: https://cwe.mitre.org/top25/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework

### Herramientas
- Snyk: Escaneo de dependencias
- SonarQube: Análisis de código estático
- OWASP ZAP: Penetration testing

---

## 🔔 10. Seguridad de Webhooks

### ✅ 10.1 Firma de Payloads (HMAC-SHA256)
- [x] Si la suscripción tiene un `secret`, el payload se firma con `hmac(payload, secret, 'sha256')`
- [x] La firma se envía en el header `x-webhook-signature: sha256=<hex>`
- [x] El receptor (n8n, Zapier) puede verificar la autenticidad recalculando el HMAC
- [ ] **Rotación de secrets**: Implementar endpoint para rotar el secret de una suscripción

```
Header enviado: x-webhook-signature: sha256=a1b2c3d4e5f6...
Verificación en n8n: HMAC-SHA256(body, secret) === header_signature
```

### ✅ 10.2 Tolerancia a Fallos
- [x] Log se crea como `PENDING` ANTES del envío
- [x] Bloque `EXCEPTION WHEN OTHERS` captura fallos de `pg_net`
- [x] Si falla, el log se marca como `FAILED` con `SQLERRM` en `response_body`
- [ ] **Reintentos automáticos** (Futuro): Implementar cron job o Edge Function que reintente logs con status `FAILED` (máx. 3 intentos)

### ✅ 10.2.1 Política de Retención y Purga Automática
- [x] `pg_cron` habilitado con job `purge-old-logs` (diario a las 3:00 AM UTC)
- [x] `webhook_logs` se purgan después de **90 días**
- [x] `audit_logs` operacionales se purgan después de **365 días**
- [x] Logs de `PLAN_CHANGE`, `TENANT_SUSPEND` y `TENANT_REACTIVATE` se preservan indefinidamente (compliance fiscal)

### ✅ 10.3 Aislamiento Multi-Tenant
- [x] RLS en `webhook_subscriptions` y `webhook_logs`
- [x] La función `dispatch_webhook()` solo busca suscripciones del `tenant_id` del registro afectado
- [x] Función es `SECURITY DEFINER` para poder insertar logs (controlada, no expuesta al usuario)

### ✅ 10.4 Soft Delete + Webhooks
- [x] Un `UPDATE` donde `deleted_at` cambia de `NULL` a un valor se emite como evento `.delete`
- [x] Esto integra la Fase 4 (Borrado Lógico) con la Fase 5 (Webhooks)

---

**Estado**: ✅ **Security Checklist Actualizado - Auditoría 2026-03-05**  
**Versión**: 1.2.0  
**Última Actualización**: 2026-03-05  
**Mantenedor**: Smart Business OS Core Team

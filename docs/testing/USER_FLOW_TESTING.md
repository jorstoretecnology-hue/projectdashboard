# 🧪 Plan de Pruebas: Flujos de Usuario y Multi-Tenant

> **Versión:** 1.0  
> **Estado:** 🔄 **EN VALIDACIÓN**  
> **Prioridad:** P0 (Crítica)

---

## 🎯 Objetivos de las Pruebas

1. **Registro**: Verificar que los usuarios pueden registrarse (email/contraseña y Google OAuth).
2. **Onboarding**: Confirmar que tras el registro, el onboarding de 3 pasos (Identidad → Industria → Plan) se ejecuta correctamente.
3. **Aprovisionamiento**: Asegurar que la creación del tenant, la asignación del plan y la activación de módulos ocurren sin errores.
4. **Acceso**: Validar que los usuarios pueden iniciar sesión y acceder al dashboard correspondiente.
5. **Aislamiento Multi-tenant (RLS)**: Probar el aislamiento creando dos tenants y verificando que no se mezclan datos.
6. **Invitaciones**: Comprobar el flujo de invitaciones por email y auto‑onboarding de nuevos miembros.

---

## 🧪 Escenarios de Prueba

### 1. Registro con Email y Contraseña
- **Acción:** Ir a `/auth/register`, completar formulario con datos válidos.
- **Esperado:**
    - Se crea usuario en Supabase Auth.
    - Se redirige a `/onboarding`.
    - En la tabla `profiles` aparece un registro con `tenant_id` NULL (pendiente de onboarding).
- **Verificación:** Revisar logs de Supabase Auth para confirmar el evento.

### 2. Registro con Google OAuth
- **Acción:** En `/auth/login`, elegir "Continuar con Google".
- **Esperado:**
    - Redirección a Google, consentimiento, y vuelta a la app.
    - Mismo flujo que registro con email, pero con datos poblados desde Google (nombre, avatar).
- **Verificación:** Comprobar que `profiles.avatar_url` se llena correctamente.

### 3. Onboarding Completo (3 pasos)
- **Acción:** Después del registro, completar los 3 pasos.
- **Esperado:**
    - Se crea el tenant en `tenants` con `industry_type` y `plan` correctos.
    - Se actualiza `profiles.tenant_id` con el ID del nuevo tenant.
    - Se activan los módulos en `tenant_modules` (vía trigger o lógica de negocio).
    - Se redirige al dashboard (`/app/dashboard`).
- **Verificación SQL:**
    ```sql
    SELECT * FROM tenants WHERE id = '...';
    SELECT * FROM profiles WHERE id = '...';
    SELECT * FROM tenant_modules WHERE tenant_id = '...';
    ```

### 4. Login de Usuario Existente
- **Acción:** Ir a `/auth/login`, ingresar credenciales.
- **Esperado:** Sesión iniciada y redirección a `/app/dashboard`. Datos aislados por tenant.

### 5. Aislamiento Multi‑tenant (RLS)
- **Acción:** Intentar acceder a datos de otro tenant modificando la URL o vía API.
- **Esperado:** Las consultas deben devolver 0 registros o error 403/404.

### 6. Flujo de Invitaciones
- **Acción:** Desde el dashboard (Owner), enviar invitación por email.
- **Esperado:** Invitado recibe email, hace clic, se registra/loguea y se le asigna al tenant correcto con su rol en `user_locations`.

---

## 📋 Checklist de Verificación

| ID | Paso | Estado | Notas |
|---|---|---|---|
| 1 | Registro con email | ⬜ | |
| 2 | Registro con Google | ⬜ | |
| 3 | Onboarding paso 1 (identidad) | ⬜ | |
| 4 | Onboarding paso 2 (industria) | ⬜ | |
| 5 | Onboarding paso 3 (plan) | ⬜ | |
| 6 | Redirección a dashboard tras onboarding | ⬜ | |
| 7 | Login con usuario existente | ⬜ | |
| 8 | Cierre de sesión | ⬜ | |
| 9 | Protección de rutas (no acceder a /app sin sesión) | ⬜ | |
| 10 | Aislamiento entre tenants (RLS) | ⬜ | |
| 11 | Invitación por email | ⬜ | |
| 12 | Aceptación de invitación | ⬜ | |
| 13 | Visualización correcta de módulos según plan | ⬜ | |
| 14 | Cambio de tema claro/oscuro | ⬜ | |

---

## 🛠️ Herramientas y Comandos Útiles

### Verificación en Supabase (SQL)
```sql
-- Perfiles y tenants
SELECT p.email, p.role, t.name as tenant_name, t.industry_type, t.plan
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id;

-- Módulos activos por tenant
SELECT t.name, tm.module_slug
FROM tenant_modules tm
JOIN tenants t ON tm.tenant_id = t.id;
```

---

*Última actualización: 18 de marzo de 2026*

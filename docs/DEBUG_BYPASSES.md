# 🐛 DEBUG BYPASSES - Desarrollo y Testing

> **Importante:** Estos bypasses son **SOLO PARA DESARROLLO**. No afectan el comportamiento en producción.

---

## 🎯 Propósito

Permitir testing de diferentes flujos de autenticación sin estar obligado a completar el onboarding.

---

## 🔧 Bypasses Disponibles

### 1. `?force_login=1` - Forzar cierre de sesión

**Ubicación:** `src/app/post-auth/page.tsx`

**Uso:**
```
http://localhost:3000/post-auth?force_login=1
```

**Qué hace:**
- Cierra la sesión local del usuario
- Redirige a `/auth/login`
- Útil para: Probar el flujo de login desde cero

**Código:**
```typescript
const forceLogin = params.force_login === '1'
if (forceLogin) {
  logger.log("[PostAuth] Force login requested, clearing session")
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/auth/login')
}
```

---

### 2. `?bypass_onboarding=1` - Saltar onboarding

**Ubicación:** `src/app/post-auth/page.tsx` y `src/middleware.ts`

**Uso:**
```
http://localhost:3000/dashboard?bypass_onboarding=1
```

**Qué hace:**
- Permite acceso al dashboard sin tener `tenant_id`
- Útil para: Testear UI del dashboard con usuarios sin tenant
- ⚠️ **Advertencia:** Algunas funcionalidades pueden fallar si requieren tenant

**Código (middleware):**
```typescript
const bypassOnboarding = request.nextUrl.searchParams.get('bypass_onboarding') === '1'

if (!tenantId && pathname !== '/onboarding' && !isPublic && !bypassOnboarding) {
  return NextResponse.redirect(new URL('/onboarding', request.url))
}
```

---

## 📋 Flujo Normal vs. Con Bypass

### Flujo Normal (Producción)
```
Usuario nuevo → /auth/register → /onboarding → Dashboard
Usuario existente → /auth/login → /post-auth → Dashboard
Usuario sin tenant → Cualquier ruta → /onboarding
```

### Con Bypass (Desarrollo)
```
Usuario con sesión → /?force_login=1 → /auth/login (sin sesión)
Usuario sin tenant → /dashboard?bypass_onboarding=1 → Dashboard (sin tenant)
```

---

## 🧪 Casos de Uso

### Caso 1: Probar login con usuario existente
```bash
# 1. Ir a esta URL para limpiar sesión
http://localhost:3000/post-auth?force_login=1

# 2. Ahora puedes probar el login
http://localhost:3000/auth/login
```

### Caso 2: Testear dashboard sin completar onboarding
```bash
# Después de registrar un usuario (sin crear tenant)
http://localhost:3000/dashboard?bypass_onboarding=1
```

### Caso 3: Ver página de login directamente
```bash
# El middleware normalmente redirige al dashboard si hay sesión
# Con force_login=1, puedes ver la página de login
http://localhost:3000/auth/login?force_login=1
```

---

## ⚠️ Advertencias

1. **No usar en producción:** Estos bypasses están diseñados para desarrollo local
2. **Funcionalidad limitada:** Sin `tenant_id`, muchas características del dashboard no funcionarán
3. **RLS puede bloquear datos:** Las políticas de Row Level Security pueden prevenir acceso a datos sin tenant

---

## 🔍 Debugging Tips

### Ver estado del usuario
```typescript
// En la consola del navegador
const { data } = await supabase.auth.getUser()
console.log('User:', data.user)
console.log('Tenant ID:', data.user?.app_metadata?.tenant_id)
```

### Ver logs del servidor
Los logs muestran cuándo se activan los bypasses:
```
[PostAuth] Force login requested, clearing session
[PostAuth] Bypass onboarding enabled (DEBUG MODE)
```

### Limpiar sesión manualmente
```javascript
// En la consola del navegador
localStorage.clear()
document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"))
window.location.reload()
```

---

## 📝 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/app/post-auth/page.tsx` | Agregados `force_login` y `bypass_onboarding` |
| `src/middleware.ts` | Agregados bypasses + `/onboarding` a PUBLIC_ROUTES |
| `src/app/page.tsx` | Redirección de `/` a `/auth/login` (no autenticados) |

---

## 🚀 Comandos Útiles

```bash
# Reiniciar servidor de desarrollo
npm run dev

# Limpiar caché de Next.js
rm -rf .next

# Ver logs en tiempo real
npm run dev 2>&1 | grep -E "\[PostAuth\]|\[Middleware\]"
```

---

**Fecha de creación:** 15 de marzo de 2026  
**Versión:** 4.6.0

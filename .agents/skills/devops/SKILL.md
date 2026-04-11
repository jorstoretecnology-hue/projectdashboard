---
name: devops-deploy
description: >
  Deployment, infraestructura, CI/CD y operaciones para proyectos Next.js
  con Supabase. Usar cuando el usuario quiera: hacer deploy, configurar
  variables de entorno en producción, resolver errores de build, configurar
  dominio, SSL, backups, monitoreo, CI/CD pipelines, o cualquier aspecto
  de infraestructura y operaciones. Activar con: deploy, producción, Vercel,
  variables de entorno, dominio, SSL, build, CI/CD, backup, infraestructura.
---

# DevOps y Deployment

## Stack de infraestructura recomendado

```
Frontend/API:     Vercel (zero-config para Next.js)
Base de datos:    Supabase (PostgreSQL managed)
Archivos:         Supabase Storage
Emails:           Resend
Errores:          Sentry
Analytics:        Vercel Analytics (incluido)
DNS/WAF:          Cloudflare (gratis)
Pagos:            MercadoPago (Colombia/LATAM)
```

---

## Deploy en Vercel

### Configuración inicial
```bash
# 1. Conectar repositorio en vercel.com
# 2. Configurar variables de entorno
# 3. Deploy automático desde main branch
```

### Variables de entorno en Vercel
```bash
# Agregar en Vercel Dashboard → Project → Settings → Environment Variables

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=https://tudominio.com

# Pagos
MP_ACCESS_TOKEN=APP_USR...
MP_PUBLIC_KEY=APP_USR...
MP_WEBHOOK_SECRET=...

# Emails
RESEND_API_KEY=re_...

# Monitoreo
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# Seguridad
SUPERADMIN_CREATION_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Ambientes recomendados
```
Production  → rama: main       → tudominio.com
Preview     → rama: develop    → preview-xxx.vercel.app
Development → local            → localhost:3000
```

---

## Supabase en producción

### Migraciones seguras
```bash
# NUNCA ejecutar SQL directamente en producción sin respaldo

# 1. Crear migración con nombre descriptivo
# supabase/migrations/20260315000001_descripcion.sql

# 2. Probar en desarrollo
supabase db reset  # reset local
supabase db push   # aplicar migraciones

# 3. Revisar el SQL manualmente antes de producción

# 4. Aplicar en producción con respaldo previo
# → Supabase Dashboard → Database → Backups → Manual backup
# → SQL Editor → ejecutar migración
# → Verificar con query de validación
```

### Backups
```
Automáticos (Supabase):
- Daily backups incluidos en todos los planes
- Point-in-time recovery en plan Pro+

Manuales (recomendados antes de migraciones grandes):
- Supabase Dashboard → Database → Backups → Download
- O via pg_dump si tienes acceso directo
```

### Variables de entorno en Supabase
```sql
-- Para Edge Functions que necesitan secrets
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set MP_ACCESS_TOKEN=APP_USR...
```

---

## Configuración de dominio

### Con Cloudflare (recomendado)
```
1. Comprar dominio (ej: antigravity.co)
2. Agregar a Cloudflare (DNS gratuito + WAF)
3. Configurar en Vercel:
   - Project → Settings → Domains → Add Domain
   - Copiar los registros DNS que Vercel indica
4. Configurar en Cloudflare:
   - Type: CNAME, Name: @, Target: cname.vercel-dns.com
   - Proxied: ON (activa WAF y CDN)
5. SSL automático en ~5 minutos
```

### Configurar en Supabase Auth
```
Supabase Dashboard → Auth → URL Configuration
Site URL: https://tudominio.com
Redirect URLs:
  https://tudominio.com/auth/callback
  https://tudominio.com/auth/reset-password
```

---

## CI/CD con GitHub Actions

### Pipeline básico
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

---

## Monitoreo y alertas

### Sentry — alertas críticas
```
Configurar alertas para:
- Error rate > 1% en producción → alerta inmediata
- New issue → alerta en 1 hora
- Regression → alerta inmediata
```

### Cloudflare — analytics gratuitos
```
Dashboard → Analytics:
- Requests totales
- Bandwidth
- Threats blocked (ataques bloqueados)
- Page load times por país
```

### Supabase — métricas de DB
```
Dashboard → Reports:
- Query performance (queries lentas)
- Database size
- Connections activas
- RLS policy hits
```

---

## Checklist de deployment

### Antes del primer deploy a producción
```
Código:
[ ] npm run build exitoso localmente
[ ] npx tsc --noEmit sin errores
[ ] npm run lint sin errores críticos
[ ] Tests pasando

Variables de entorno:
[ ] Todas configuradas en Vercel
[ ] NEXT_PUBLIC_APP_URL apunta al dominio real
[ ] Supabase URLs en Auth actualizadas al dominio real
[ ] MercadoPago en modo producción (no sandbox)

Base de datos:
[ ] Migraciones aplicadas en producción
[ ] RLS habilitado en todas las tablas
[ ] Backup manual tomado

Seguridad:
[ ] service_role_key solo en variables de servidor
[ ] Cloudflare WAF activo
[ ] Rate limiting configurado
[ ] HTTPS funcionando

Testing post-deploy:
[ ] Login funciona
[ ] Onboarding completo funciona
[ ] Flujo principal de la app funciona
[ ] Emails se envían correctamente
[ ] Sentry recibe eventos
```

### Antes de cada deploy posterior
```
[ ] npm run build exitoso
[ ] Cambios revisados en preview environment
[ ] Migraciones de DB preparadas y probadas
[ ] Rollback plan definido si algo falla
```

---

## Disaster Recovery

### Si la DB falla
```
1. Identificar el problema (Supabase Status page)
2. Si es dato corrupto → restaurar desde backup
3. Si es migración fallida → rollback manual
4. Comunicar a usuarios afectados
```

### Si el deploy falla en Vercel
```bash
# Rollback inmediato en Vercel Dashboard
# → Deployments → Click en deployment anterior → Promote to Production

# O via CLI
vercel rollback
```

### Si hay brecha de seguridad
```
1. Revocar todas las sesiones activas:
   → Supabase Auth → Users → Revoke all tokens
2. Cambiar secrets comprometidos:
   → service_role_key, webhook secrets, API keys
3. Revisar audit_logs para identificar el alcance
4. Notificar a usuarios afectados (obligatorio por Habeas Data Colombia)
```

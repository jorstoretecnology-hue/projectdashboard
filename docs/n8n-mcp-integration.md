# Integración MCP Server de n8n

## Descripción

Este documento describe la configuración del servidor MCP (Model Context Protocol) para integrar n8n con el Dashboard Universal, permitiendo la creación y gestión de workflows de automatización directamente desde el asistente de IA.

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Qwen Code     │────▶│  MCP Server n8n  │────▶│   n8n (Docker)  │
│   (IDE/Editor)  │     │  (Node.js CLI)   │     │  localhost:5678 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                        │
                                ▼                        ▼
                         ┌──────────────────┐     ┌─────────────────┐
                         │   Variables .env │     │  Ngrok Tunnel   │
                         │   N8N_API_KEY    │     │  (webhooks ext) │
                         └──────────────────┘     └─────────────────┘
```

## Configuración

### 1. Variables de Entorno

Copiar `.env.local.example` a `.env` y configurar:

```bash
# n8n Integration
N8N_HOST=http://localhost:5678
N8N_WEBHOOK_URL=https://cauline-lacey-tempered.ngrok-free.dev
N8N_API_KEY=tu-api-key-aqui
NGROK_AUTHTOKEN=tu-ngrok-authtoken-aqui
```

### 2. Generar API Key en n8n

1. Iniciar n8n: `docker compose up -d n8n`
2. Abrir navegador: `http://localhost:5678`
3. Ir a **Settings** > **API**
4. Click en **Create API Key**
5. Copiar la key y guardarla en `.env`

### 3. Configurar MCP Server

El archivo `.qwen/settings.json` ya está configurado:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": [
        "C:/Users/Jaomart/mcp-servers/node_modules/@drballs/n8n-mcp-server/dist/index.js"
      ],
      "env": {
        "N8N_HOST": "http://localhost:5678",
        "N8N_API_KEY": "${N8N_API_KEY}"
      }
    }
  }
}
```

### 4. Instalar Dependencias del MCP Server

```bash
# Instalar el servidor MCP de n8n (si no está instalado)
npm install -g @drballs/n8n-mcp-server

# Verificar instalación
npx @drballs/n8n-mcp-server --version
```

## Uso

### Comandos Disponibles

Una vez configurado, puedes solicitar a Qwen Code que:

1. **Listar Workflows**
   ```
   "Muéstrame todos los workflows activos en n8n"
   ```

2. **Crear Workflow**
   ```
   "Crea un workflow que envíe un email cuando se registre un nuevo tenant"
   ```

3. **Ejecutar Workflow**
   ```
   "Ejecuta el workflow de onboarding para el tenant XYZ"
   ```

4. **Gestionar Credenciales**
   ```
   "Lista las credenciales configuradas en n8n"
   ```

### Integración con Webhooks de Supabase

Los eventos de la base de datos se envían automáticamente a n8n:

```sql
-- Los triggers en Supabase envían eventos a:
-- https://cauline-lacey-tempered.ngrok-free.dev/webhook/supabase-events

-- Ejemplo de evento:
{
  "event_id": "uuid",
  "tenant_id": "uuid",
  "event_type": "tenant.created",
  "entity_type": "tenants",
  "entity_id": "uuid",
  "payload": {...},
  "created_at": "2026-03-23T00:00:00Z",
  "environment": "production"
}
```

## Flujo de Trabajo Recomendado

### 1. Crear Workflow de Notificación

```
Usuario → Qwen: "Crea un workflow para notificar nuevos registros"
   ↓
Qwen → MCP n8n: Crea workflow con webhook trigger
   ↓
MCP n8n → n8n: POST /api/v1/workflows
   ↓
n8n → Webhook: Configura endpoint /webhook/new-registration
   ↓
Supabase → n8n: Trigger envía evento al webhook
   ↓
n8n → WhatsApp/Email: Envía notificación
```

### 2. Automatizar Onboarding

```
1. Crear workflow "tenant.onboarding"
2. Configurar trigger: domain_events (entity_type = 'tenants')
3. Acciones:
   - Crear carpeta en Google Drive
   - Enviar email de bienvenida
   - Programar tarea de configuración inicial
   - Notificar al equipo por Slack
```

## Troubleshooting

### El MCP Server no conecta

```bash
# 1. Verificar que n8n esté corriendo
docker compose ps

# 2. Verificar logs de n8n
docker compose logs n8n

# 3. Probar conexión directa
curl http://localhost:5678/healthz

# 4. Verificar API Key
curl -H "X-N8N-API-KEY: tu-key" http://localhost:5678/api/v1/workflows
```

### Webhooks no reciben eventos

```bash
# 1. Verificar Ngrok
docker compose logs ngrok

# 2. Verificar URL del webhook en Supabase
# Revisar: supabase/migrations/*_stabilize_n8n_webhook.sql

# 3. Probar webhook manualmente
curl -X POST https://cauline-lacey-tempered.ngrok-free.dev/webhook/supabase-events \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Seguridad

### Best Practices

1. **Nunca commitear `.env`** al repositorio
2. **Rotar API Keys** periódicamente
3. **Usar HTTPS** para webhooks en producción
4. **Validar firmas HMAC** en los webhooks
5. **Rate limiting** en endpoints expuestos

### Configuración de Seguridad en n8n

```yaml
# docker-compose.yml (producción)
environment:
  - N8N_ENCRYPTION_KEY=your-encryption-key
  - N8N_USER_MANAGEMENT_JWT_SECRET=your-jwt-secret
  - N8N_SECURE_COOKIE=true
```

## Referencias

- [n8n API Documentation](https://docs.n8n.io/hosting/api-commands/)
- [n8n MCP Server](https://github.com/drballs/n8n-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Webhook Security Best Practices](https://docs.github.com/en/webhooks/using-webhooks)

## Archivos Relacionados

- `.qwen/settings.json` - Configuración MCP
- `.env.local.example` - Variables de entorno
- `docker-compose.yml` - Servicios Docker (n8n + ngrok)
- `supabase/migrations/*n8n*` - Migraciones de webhooks
- `start-all.ps1` - Script de arranque completo

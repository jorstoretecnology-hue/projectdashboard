# 🚀 Configuración Rápida - n8n MCP Server

## Estado Actual

✅ **n8n corriendo**: http://localhost:5678
✅ **MCP Server instalado**: @drballs/n8n-mcp-server
✅ **Configuración MCP**: `.qwen/settings.json`
⚠️ **API Key**: Requiere configuración manual en la UI

## Pasos para activar la integración

### 1. Configurar API Key Manualmente (Requerido)

Debido a cambios en n8n 2.x, la API Key debe generarse desde la UI:

1. **Abrir n8n**: https://cauline-lacey-tempered.ngrok-free.dev
   - O local: http://localhost:5678

2. **Iniciar sesión** con tus credenciales de owner

3. **Ir a Settings** (icono de engranaje abajo izquierda)

4. **Seleccionar "API"** en el menú lateral

5. **Click en "Create API Key"**
   - Label: `MCP Server`
   - Scopes: `["*"]` (todos los permisos)

6. **Copiar la API Key** generada

7. **Actualizar `.qwen/settings.json`**:
   ```json
   {
     "mcpServers": {
       "n8n": {
         "command": "npx.cmd",
         "args": ["@drballs/n8n-mcp-server"],
         "env": {
           "N8N_BASE_URL": "http://localhost:5678",
           "N8N_API_KEY": "TU_API_KEY_AQUI"
         }
       }
     }
   }
   ```

### 2. Verificar Configuración

```bash
# Verificar que n8n está corriendo
docker compose ps

# Probar la API Key
curl -H "X-N8N-API-KEY: TU_API_KEY" http://localhost:5678/api/v1/workflows
```

### 3. Iniciar Servicios

```bash
# Opción A: Usar script PowerShell (recomendado)
.\start-all.ps1

# Opción B: Manual
docker compose up -d
npm run dev
```

### 4. Probar MCP Server

El servidor MCP está configurado en `.qwen/settings.json` y se cargará automáticamente en Qwen Code.

**Comandos de prueba:**
- "Lista los workflows de n8n"
- "Crea un webhook para nuevos tenants"
- "Muestra las credenciales configuradas"

## Estructura de Archivos

```
E:\ProyectDashboard/
├── .env                          # Variables de entorno (crear)
├── .env.local.example            # Ejemplo de variables
├── .qwen/
│   └── settings.json             # Configuración MCP Server ✅
├── docker-compose.yml            # Servicios Docker (n8n + ngrok) ✅
├── docs/
│   └── n8n-mcp-integration.md    # Documentación completa ✅
└── supabase/migrations/
    └── *n8n*                     # Triggers de webhooks ✅
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| MCP no conecta | Verificar `docker compose ps` |
| API Key inválida | Regenerar en n8n Settings > API |
| Ngrok no funciona | Verificar token en `.env` |

## Recursos

- 📖 [Documentación Completa](docs/n8n-mcp-integration.md)
- 🔗 [n8n API Docs](https://docs.n8n.io/hosting/api-commands/)
- 🐛 [Reportar Issues](https://github.com/drballs/n8n-mcp-server/issues)

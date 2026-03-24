# =============================================================================
# Script para generar API Key de n8n automáticamente
# =============================================================================
# Este script accede a la base de datos SQLite de n8n y genera una API Key
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🔑 Generador de API Key para n8n" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verificar que n8n esté corriendo
Write-Host "`n[1/4] Verificando n8n..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5678/healthz" -ErrorAction Stop
    Write-Host "✅ n8n está corriendo (Status: $($health.status))" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n no está accesible. Ejecuta: docker compose up -d n8n" -ForegroundColor Red
    exit 1
}

# 2. Obtener información del usuario owner
Write-Host "`n[2/4] Obteniendo información del usuario owner..." -ForegroundColor Green

# n8n almacena los usuarios en su base de datos SQLite
# El owner es el primer usuario creado
$dbPath = "C:\ProgramData\Docker\volumes\proyectdashboard_n8n_data\_data\database.sqlite"

if (Test-Path $dbPath) {
    Write-Host "✅ Base de datos encontrada: $dbPath" -ForegroundColor Green
    
    # Usar Python o sqlite3 para leer la DB
    $sqliteExists = Get-Command sqlite3 -ErrorAction SilentlyContinue
    $pythonExists = Get-Command python -ErrorAction SilentlyContinue
    
    if ($pythonExists) {
        Write-Host "✅ Python encontrado, extrayendo usuario owner..." -ForegroundColor Green
        
        $pythonScript = @'
import sqlite3
import json
import secrets
import hashlib
from datetime import datetime

db_path = r"DB_PATH_PLACEHOLDER"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Obtener el primer usuario (owner)
cursor.execute("SELECT id, email, firstName FROM user WHERE id = (SELECT MIN(id) FROM user)")
user = cursor.fetchone()

if user:
    user_id, email, first_name = user
    print(f"USER_ID:{user_id}")
    print(f"EMAIL:{email}")
    print(f"NAME:{first_name}")
    
    # Generar API Key
    api_key = secrets.token_urlsafe(32)
    
    # Insertar en la tabla de API keys
    # n8n usa la tabla "auth_identity" o "api_key" dependiendo de la versión
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='api_key'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        # Versión nueva de n8n (2.x)
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        cursor.execute("""
            INSERT INTO api_key (id, api_key, user_id, created_at, updated_at, label)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            secrets.token_urlsafe(16),
            key_hash,
            user_id,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
            "MCP Server Auto-Generated"
        ))
        conn.commit()
        print(f"API_KEY:{api_key}")
        print("✅ API Key generada exitosamente")
    else:
        print("❌ Tabla api_key no encontrada. Versión de n8n puede ser incompatible")
else:
    print("❌ No se encontró el usuario owner")

conn.close()
'@
        
        $pythonScript = $pythonScript -replace "DB_PATH_PLACEHOLDER", $dbPath
        
        $output = python -c $pythonScript 2>&1
        
        foreach ($line in $output) {
            Write-Host $line
            
            if ($line -match "API_KEY:(.+)") {
                $apiKey = $matches[1]
                
                # 3. Actualizar archivo .env
                Write-Host "`n[3/4] Actualizando archivo .env..." -ForegroundColor Green
                $envPath = Join-Path $PSScriptRoot ".env"
                
                if (Test-Path $envPath) {
                    $content = Get-Content $envPath -Raw
                    $content = $content -replace "(N8N_API_KEY=).*", "`$1$apiKey"
                    Set-Content $envPath $content -NoNewline
                    Write-Host "✅ .env actualizado con la API Key" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ Archivo .env no encontrado" -ForegroundColor Yellow
                }
                
                # 4. Verificar API Key
                Write-Host "`n[4/4] Verificando API Key..." -ForegroundColor Green
                try {
                    $headers = @{
                        "X-N8N-API-KEY" = $apiKey
                        "Content-Type" = "application/json"
                    }
                    $response = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" -Headers $headers -Method GET
                    Write-Host "✅ API Key válida! Workflows encontrados: $($response.data.Count)" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️ API Key podría no estar activa aún. Reinicia n8n si es necesario." -ForegroundColor Yellow
                }
                
                Write-Host "`n=========================================" -ForegroundColor Cyan
                Write-Host "🎉 ¡API Key generada exitosamente!" -ForegroundColor Green
                Write-Host "=========================================" -ForegroundColor Cyan
                Write-Host "`nAPI Key: $apiKey" -ForegroundColor White
                Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
                Write-Host "  1. Revisa tu archivo .env" -ForegroundColor Gray
                Write-Host "  2. Abre n8n: https://cauline-lacey-tempered.ngrok-free.dev" -ForegroundColor Gray
                Write-Host "  3. Prueba el MCP Server en Qwen Code" -ForegroundColor Gray
                Write-Host "`n" -ForegroundColor Gray
                
                break
            }
        }
    } elseif ($sqliteExists) {
        Write-Host "✅ sqlite3 encontrado" -ForegroundColor Green
        # Usar sqlite3 directamente
        $userId = sqlite3 $dbPath "SELECT id FROM user ORDER BY id ASC LIMIT 1;"
        Write-Host "Owner ID: $userId" -ForegroundColor Green
    } else {
        Write-Host "❌ Ni Python ni sqlite3 están disponibles" -ForegroundColor Red
        Write-Host "Instala Python desde https://python.org o usa la UI de n8n" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Base de datos de n8n no encontrada en: $dbPath" -ForegroundColor Red
    Write-Host "`nAlternativa manual:" -ForegroundColor Yellow
    Write-Host "  1. Abre: https://cauline-lacey-tempered.ngrok-free.dev" -ForegroundColor Gray
    Write-Host "  2. Inicia sesión con tus credenciales" -ForegroundColor Gray
    Write-Host "  3. Ve a Settings > API" -ForegroundColor Gray
    Write-Host "  4. Click en 'Create API Key'" -ForegroundColor Gray
    Write-Host "  5. Copia la key en tu archivo .env" -ForegroundColor Gray
}

Write-Host "`nScript completado." -ForegroundColor Cyan

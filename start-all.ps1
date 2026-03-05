<#
.SYNOPSIS
Script de arranque dual para ProyectDashboard (Windows)

.DESCRIPTION
Levanta el backend (Docker: n8n + ngrok) en segundo plano, y lanza el entorno Next.js en la ventana actual.
Al iniciar Next.js, abre el navegador en localhost:3000.
#>

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Entorno Smart Business OS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verificar variables de entorno
if (!(Test-Path ".env")) {
    Write-Host "⚠️ Advertencia: Archivo .env no encontrado." -ForegroundColor Yellow
    Write-Host "Asegurate de tener NGROK_AUTHTOKEN definido en tu .env para que inicie el tunel." -ForegroundColor Yellow
}

# 2. Iniciar Docker Compose (Backend)
Write-Host "`n[1/3] Iniciando backend (n8n + Ngrok)..." -ForegroundColor Green
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar Docker Compose. Asegurate de que Docker Desktop este corriendo." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend iniciado en segundo plano." -ForegroundColor Green

# 3. Lanzar el Frontend en la misma ventana con una pausa corta para abrir el navegador
Write-Host "`n[2/3] Preparando Next.js..." -ForegroundColor Green

# Iniciar Next.js en una nueva ventana visible
Write-Host ">>> Se abrira una nueva ventana negra para Next.js. ¡NO LA CIERRES! <<<" -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/c npm run dev" -Wait:$false

Write-Host "`n[3/3] Abriendo navegador (esperando 8 segundos a que compile)..." -ForegroundColor Green
Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"

Write-Host "`n🌟 Entorno listo." -ForegroundColor Cyan
Write-Host "La terminal de Next.js (npm) esta corriendo en otra ventana separada." -ForegroundColor Cyan
Write-Host "(Nota: Para apagar n8n/Ngrok, ejecuta: docker compose down)" -ForegroundColor Gray


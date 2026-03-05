#!/usr/bin/env pwsh
# Script de Verificacion de Seguridad - Dashboard Universal
# Verifica que .env.local no este en Git y que las configuraciones de seguridad esten correctas

Write-Host "Verificacion de Seguridad - Dashboard Universal" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si estamos en un repositorio Git
$isGitRepo = Test-Path ".git"

if (-not $isGitRepo) {
    Write-Host "ADVERTENCIA: No se detecto un repositorio Git" -ForegroundColor Yellow
    Write-Host "   Este proyecto no esta bajo control de versiones" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Repositorio Git detectado" -ForegroundColor Green
    Write-Host ""

    # 1. Verificar que .env.local NO este en Git
    Write-Host "1. Verificando .env.local..." -ForegroundColor Cyan
    
    $envLocalTracked = git ls-files | Select-String -Pattern "\.env\.local"
    
    if ($envLocalTracked) {
        Write-Host "CRITICO: .env.local esta siendo trackeado por Git!" -ForegroundColor Red
        Write-Host "   Archivo encontrado: $envLocalTracked" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Ejecuta estos comandos para corregirlo:" -ForegroundColor Yellow
        Write-Host "   git rm --cached .env.local" -ForegroundColor White
        Write-Host "   git commit -m 'security: remove .env.local from tracking'" -ForegroundColor White
        Write-Host ""
        $hasIssues = $true
    } else {
        Write-Host "OK: .env.local NO esta en Git (correcto)" -ForegroundColor Green
        Write-Host ""
    }

    # 2. Verificar .gitignore
    Write-Host "2. Verificando .gitignore..." -ForegroundColor Cyan
    
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        
        if ($gitignoreContent -match "\.env\.local" -or $gitignoreContent -match "\.env\*\.local") {
            Write-Host "OK: .gitignore incluye proteccion para .env.local" -ForegroundColor Green
        } else {
            Write-Host "ADVERTENCIA: .gitignore no incluye .env.local" -ForegroundColor Yellow
            Write-Host "   Agrega esta linea a .gitignore:" -ForegroundColor Yellow
            Write-Host "   .env*.local" -ForegroundColor White
            $hasWarnings = $true
        }
    } else {
        Write-Host "ERROR: No se encontro archivo .gitignore" -ForegroundColor Red
        $hasIssues = $true
    }
    Write-Host ""
}

# 3. Verificar que .env.local existe
Write-Host "3. Verificando archivos de entorno..." -ForegroundColor Cyan

if (Test-Path ".env.local") {
    Write-Host "OK: .env.local existe" -ForegroundColor Green
    
    # Verificar que contiene las variables necesarias
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "Variables faltantes en .env.local:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "   - $var" -ForegroundColor Yellow
        }
        $hasWarnings = $true
    } else {
        Write-Host "OK: Todas las variables requeridas estan presentes" -ForegroundColor Green
    }
} else {
    Write-Host "ADVERTENCIA: .env.local no existe" -ForegroundColor Yellow
    Write-Host "   Copia .env.example a .env.local y configura tus credenciales" -ForegroundColor Yellow
    $hasWarnings = $true
}
Write-Host ""

# 4. Verificar .env.example
Write-Host "4. Verificando .env.example..." -ForegroundColor Cyan

if (Test-Path ".env.example") {
    Write-Host "OK: .env.example existe" -ForegroundColor Green
    
    $exampleContent = Get-Content ".env.example" -Raw
    
    # Verificar que NO contiene credenciales reales
    if ($exampleContent -match "nabuveqxvgcabhicxgat" -or $exampleContent -match "sb_publishable") {
        Write-Host "CRITICO: .env.example contiene credenciales reales!" -ForegroundColor Red
        Write-Host "   Reemplaza con valores placeholder" -ForegroundColor Red
        $hasIssues = $true
    } else {
        Write-Host "OK: .env.example no contiene credenciales reales" -ForegroundColor Green
    }
} else {
    Write-Host "ADVERTENCIA: .env.example no existe" -ForegroundColor Yellow
    $hasWarnings = $true
}
Write-Host ""

# 5. Verificar migraciones de Supabase
Write-Host "5. Verificando configuracion de Supabase..." -ForegroundColor Cyan

if (Test-Path "supabase/migrations") {
    $migrations = Get-ChildItem "supabase/migrations" -Filter "*.sql"
    Write-Host "OK: Encontradas $($migrations.Count) migraciones" -ForegroundColor Green
    
    # Verificar que hay politicas RLS
    $rlsFound = $false
    foreach ($migration in $migrations) {
        $content = Get-Content $migration.FullName -Raw
        if ($content -match "enable row level security") {
            $rlsFound = $true
            break
        }
    }
    
    if ($rlsFound) {
        Write-Host "OK: Row Level Security (RLS) configurado en migraciones" -ForegroundColor Green
    } else {
        Write-Host "ADVERTENCIA: No se encontraron politicas RLS en migraciones" -ForegroundColor Yellow
        $hasWarnings = $true
    }
} else {
    Write-Host "ADVERTENCIA: No se encontro carpeta de migraciones de Supabase" -ForegroundColor Yellow
    $hasWarnings = $true
}
Write-Host ""

# 6. Verificar helpers de seguridad
Write-Host "6. Verificando helpers de seguridad..." -ForegroundColor Cyan

$helpers = @(
    @{ Path = "src/lib/env.ts"; Name = "Validacion de env" },
    @{ Path = "src/lib/error-handler.ts"; Name = "Manejo de errores" },
    @{ Path = "src/lib/storage.ts"; Name = "localStorage seguro" }
)

foreach ($helper in $helpers) {
    if (Test-Path $helper.Path) {
        Write-Host "OK: $($helper.Name)" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $($helper.Name) - NO ENCONTRADO" -ForegroundColor Red
        $hasIssues = $true
    }
}
Write-Host ""

# Resumen
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

if ($hasIssues) {
    Write-Host "Se encontraron problemas CRITICOS de seguridad" -ForegroundColor Red
    Write-Host "Revisa los mensajes anteriores y corrigelos inmediatamente" -ForegroundColor Red
    exit 1
} elseif ($hasWarnings) {
    Write-Host "Se encontraron advertencias" -ForegroundColor Yellow
    Write-Host "Revisa los mensajes anteriores" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Todas las verificaciones pasaron correctamente" -ForegroundColor Green
    Write-Host "Tu configuracion de seguridad esta bien" -ForegroundColor Green
    exit 0
}

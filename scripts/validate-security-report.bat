@echo off
REM 🔐 Security Report JSON Validator (Windows)
REM Valida localmente el reporte de seguridad generado por Qwen CLI

setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0.."
set "DOCS_DIR=%PROJECT_ROOT%\docs"

REM Encontrar el reporte más reciente
set "REPORT="
for /f "delims=" %%f in ('dir /b /o-d "%DOCS_DIR%\SECURITY_PIPELINE_*.json" 2^>nul') do (
    if not defined REPORT set "REPORT=%DOCS_DIR%\%%f"
)

if not defined REPORT (
    echo ❌ No se encontro ningun reporte JSON en %DOCS_DIR%
    echo.
    echo Primero ejecuta la auditoria:
    echo   qwen --prompt docs/SECURITY_AUDIT_PROMPT.md --output docs/SECURITY_PIPELINE_%%date:~6,4%%date:~3,2%%date:~0,2%%.json
    exit /b 1
)

echo 🔍 Validando reporte: %REPORT%
echo.

REM Verificar que jq esta instalado
where jq >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ jq no esta instalado. Installalo con:
    echo    choco install jq
    exit /b 1
)

set /a FAIL_COUNT=0

REM ===========================================
REM ERRORES DE TIPO (CRITICO)
REM ===========================================
for /f "delims=" %%a in ('jq -r ".errors.typeErrors // 0" "%REPORT%"') do set "TYPE_ERRORS=%%a"
if %TYPE_ERRORS% gtr 0 (
    echo ❌ Errores de tipo: %TYPE_ERRORS%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Sin errores de tipo
)

REM ===========================================
REM ANY TYPES
REM ===========================================
for /f "delims=" %%a in ('jq -r ".errors.anyTypes // 0" "%REPORT%"') do set "ANY_TYPES=%%a"
if %ANY_TYPES% gtr 0 (
    echo ❌ Tipos 'any': %ANY_TYPES%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Sin tipos 'any'
)

REM ===========================================
REM CONSOLE.LOG
REM ===========================================
for /f "delims=" %%a in ('jq -r ".errors.consoleLogs // 0" "%REPORT%"') do set "CONSOLE_LOGS=%%a"
if %CONSOLE_LOGS% gtr 0 (
    echo ❌ console.log: %CONSOLE_LOGS%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Sin console.log
)

REM ===========================================
REM SELECT(*) QUERIES
REM ===========================================
for /f "delims=" %%a in ('jq -r ".errors.selectStarQueries // 0" "%REPORT%"') do set "SELECT_STAR=%%a"
if %SELECT_STAR% gtr 0 (
    echo ❌ select(*) queries: %SELECT_STAR%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Sin select(*) queries
)

REM ===========================================
REM MISSING RLS
REM ===========================================
for /f "delims=" %%a in ('jq -r ".errors.missingRls // 0" "%REPORT%"') do set "MISSING_RLS=%%a"
if %MISSING_RLS% gtr 0 (
    echo ❌ Missing RLS: %MISSING_RLS%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Todas las queries tienen RLS
)

REM ===========================================
REM VULNERABILIDADES CRITICAS
REM ===========================================
for /f "delims=" %%a in ('jq -r ".dependencies.critical // 0" "%REPORT%"') do set "VULN_CRITICAL=%%a"
if %VULN_CRITICAL% gtr 0 (
    echo ❌ Vulnerabilidades criticas: %VULN_CRITICAL%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Sin vulnerabilidades criticas
)

REM ===========================================
REM VULNERABILIDADES ALTAS
REM ===========================================
for /f "delims=" %%a in ('jq -r ".dependencies.high // 0" "%REPORT%"') do set "VULN_HIGH=%%a"
if %VULN_HIGH% gtr 0 (
    echo ❌ Vulnerabilidades altas: %VULN_HIGH%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Sin vulnerabilidades altas
)

REM ===========================================
REM TESTS FALLIDOS
REM ===========================================
for /f "delims=" %%a in ('jq -r ".tests.failed // 0" "%REPORT%"') do set "TESTS_FAILED=%%a"
if %TESTS_FAILED% gtr 0 (
    echo ❌ Tests fallidos: %TESTS_FAILED%
    set /a FAIL_COUNT+=1
) else (
    echo ✅ Todos los tests pasan
)

REM ===========================================
REM RESUMEN FINAL
REM ===========================================
echo.
if %FAIL_COUNT% gtr 0 (
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo ❌ AUDITORIA RECHAZADA
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo Hallazgos criticos: %FAIL_COUNT%
    echo.
    echo 📊 Metricas completas:
    jq "." "%REPORT%"
    exit /b 1
) else (
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo ✅ AUDITORIA APROBADA
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo 📊 Resumen:
    jq "{status: .status, tests: .tests, dependencies: {total: .dependencies.total, critical: .dependencies.critical, high: .dependencies.high}}" "%REPORT%"
)

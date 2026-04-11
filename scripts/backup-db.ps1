$PG_DUMP_PATH = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
$DB_HOST = "aws-1-us-east-1.pooler.supabase.com"
$DB_USER = "postgres.kpdadwtxfazhtoqnttdh"
$DB_NAME = "postgres"
$DB_PORT = 6543

# Crear nombre de archivo con timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmm"
$OUTPUT_FILE = "backups/full_dump_$TIMESTAMP.sql"

Write-Host "Iniciando Backup de Supabase (Plan Free)..." -ForegroundColor Cyan
Write-Host "Host: $DB_HOST" -ForegroundColor Gray
Write-Host "Destino: $OUTPUT_FILE" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $PG_DUMP_PATH)) {
    Write-Host "ERROR: No se encontro pg_dump.exe en $PG_DUMP_PATH" -ForegroundColor Red
    Write-Host "Por favor instala PostgreSQL o ajusta la ruta en el script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Por favor ingresa la contrasenia de la base de datos cuando se te solicite." -ForegroundColor Yellow
Write-Host "---------------------------------------------------------------------------"

# Ejecutar pg_dump
# -F p: Formato plain text (SQL)
# -x: No exportar privilegios (evita errores en restores parciales)
# --no-owner: No incluir comandos de cambio de dueño
& $PG_DUMP_PATH -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -F p -x --no-owner -f $OUTPUT_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "¡Backup completado exitosamente!" -ForegroundColor Green
    Write-Host "Archivo generado: $OUTPUT_FILE" -ForegroundColor Green
    
    # Mostrar resumen
    $fileInfo = Get-Item $OUTPUT_FILE
    $sizeKB = [Math]::Round($fileInfo.Length / 1KB, 2)
    Write-Host "Tamanio del archivo: $sizeKB KB" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Ocurrio un error durante el backup. Revisa tus credenciales y conectividad." -ForegroundColor Red
}

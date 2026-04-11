param (
    [Parameter(Mandatory=$true, HelpMessage="Nombre de la carpeta de la skill (ej. frontend, backend, database)")]
    [string]$Skill,
    
    [Parameter(Mandatory=$true, HelpMessage="Tarea específica que el CLI debe ejecutar")]
    [string]$Task
)

# Rutas relativas de los documentos para darselas al LLM
$rulesPath = ".agents/rules/reglas-basicas.md"
$skillPath = ".agents/skills/$Skill/SKILL.md"

# 1. Validar que los archivos de contexto existen
if (-Not (Test-Path $rulesPath)) {
    Write-Host "❌ Error: No se encuentra el archivo de reglas en $rulesPath" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path $skillPath)) {
    Write-Host "❌ Error: La skill '$Skill' no existe." -ForegroundColor Red
    exit 1
}

# 2. Construir el prompt CORTO (Optimizado para Windows)
# En lugar de meter 3000 palabras en la consola (lo que rompe Windows),
# le damos la ruta exacta a OpenCode y él, como es inteligente, los lee por su cuenta.
$shortPrompt = "INSTRUCCIÓN CRÍTICA: Primero, abre y lee las reglas globales en '$rulesPath' y los estándares de tu especialidad en '$skillPath'. Nunca asumas conocimiento previo sin leerlos. TAREA PRINCIPAL: $Task"

Write-Host "🚀 Iniciando OpenCode CLI (Modo Windows Optimizado)..." -ForegroundColor Cyan
Write-Host "🧠 Forzando lectura de: [Reglas Básicas] y [Skill: $Skill]" -ForegroundColor DarkGray
Write-Host "🎯 Tarea: $Task" -ForegroundColor DarkGray
Write-Host "----------------------------------------" -ForegroundColor Cyan

# 3. Llama a opencode con el prompt corto
opencode $shortPrompt

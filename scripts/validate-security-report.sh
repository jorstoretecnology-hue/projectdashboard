#!/bin/bash
# 🔐 Security Report JSON Validator
# Valida localmente el reporte de seguridad generado por Qwen CLI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$PROJECT_ROOT/docs"

# Encontrar el reporte más reciente
REPORT=$(ls -t "$DOCS_DIR"/SECURITY_PIPELINE_*.json 2>/dev/null | head -n 1)

if [ -z "$REPORT" ]; then
    echo "❌ No se encontró ningún reporte JSON en $DOCS_DIR"
    echo ""
    echo "Primero ejecuta la auditoría:"
    echo "  qwen --prompt docs/SECURITY_AUDIT_PROMPT.md --output docs/SECURITY_PIPELINE_\$(date +'%Y%m%d').md"
    exit 1
fi

echo "🔍 Validando reporte: $REPORT"
echo ""

# Verificar que jq está instalado
if ! command -v jq &> /dev/null; then
    echo "❌ jq no está instalado. Instálalo con:"
    echo "   macOS: brew install jq"
    echo "   Ubuntu: sudo apt-get install jq"
    echo "   Windows: choco install jq"
    exit 1
fi

FAIL_COUNT=0

# ===========================================
# ERRORES DE TIPO (CRÍTICO)
# ===========================================
TYPE_ERRORS=$(jq -r '.errors.typeErrors // 0' "$REPORT")
if [ "$TYPE_ERRORS" -gt 0 ]; then
    echo "❌ Errores de tipo: $TYPE_ERRORS"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Sin errores de tipo"
fi

# ===========================================
# ANY TYPES
# ===========================================
ANY_TYPES=$(jq -r '.errors.anyTypes // 0' "$REPORT")
if [ "$ANY_TYPES" -gt 0 ]; then
    echo "❌ Tipos 'any': $ANY_TYPES"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Sin tipos 'any'"
fi

# ===========================================
# CONSOLE.LOG
# ===========================================
CONSOLE_LOGS=$(jq -r '.errors.consoleLogs // 0' "$REPORT")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "❌ console.log: $CONSOLE_LOGS"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Sin console.log"
fi

# ===========================================
# SELECT(*) QUERIES
# ===========================================
SELECT_STAR=$(jq -r '.errors.selectStarQueries // 0' "$REPORT")
if [ "$SELECT_STAR" -gt 0 ]; then
    echo "❌ select(*) queries: $SELECT_STAR"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Sin select(*) queries"
fi

# ===========================================
# MISSING RLS
# ===========================================
MISSING_RLS=$(jq -r '.errors.missingRls // 0' "$REPORT")
if [ "$MISSING_RLS" -gt 0 ]; then
    echo "❌ Missing RLS: $MISSING_RLS"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Todas las queries tienen RLS"
fi

# ===========================================
# VULNERABILIDADES CRÍTICAS
# ===========================================
VULN_CRITICAL=$(jq -r '.dependencies.critical // 0' "$REPORT")
if [ "$VULN_CRITICAL" -gt 0 ]; then
    echo "❌ Vulnerabilidades críticas: $VULN_CRITICAL"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Sin vulnerabilidades críticas"
fi

# ===========================================
# VULNERABILIDADES ALTAS
# ===========================================
VULN_HIGH=$(jq -r '.dependencies.high // 0' "$REPORT")
if [ "$VULN_HIGH" -gt 0 ]; then
    echo "❌ Vulnerabilidades altas: $VULN_HIGH"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Sin vulnerabilidades altas"
fi

# ===========================================
# TESTS FALLIDOS
# ===========================================
TESTS_FAILED=$(jq -r '.tests.failed // 0' "$REPORT")
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo "❌ Tests fallidos: $TESTS_FAILED"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ Todos los tests pasan"
fi

# ===========================================
# RESUMEN FINAL
# ===========================================
echo ""
if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ AUDITORÍA RECHAZADA"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Hallazgos críticos: $FAIL_COUNT"
    echo ""
    echo "📊 Métricas completas:"
    jq '.' "$REPORT"
    exit 1
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ AUDITORÍA APROBADA"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Resumen:"
    jq '{
        status: .status,
        tests: .tests,
        dependencies: {
            total: .dependencies.total,
            critical: .dependencies.critical,
            high: .dependencies.high
        }
    }' "$REPORT"
fi

#!/usr/bin/env node
/**
 * 🔐 Security Report JSON Validator
 * Valida localmente el reporte de seguridad generado por Qwen CLI
 * 
 * Uso: npm run security:validate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const THRESHOLDS = {
  typeErrors: 0,
  anyTypes: 0,
  consoleLogs: 0,
  selectStarQueries: 0,
  missingRls: 0,
  missingZodValidation: 0,
  hardcodedSecrets: 0,
  dependenciesCritical: 0,
  dependenciesHigh: 0,
  testsFailed: 0
};

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkMetric(name, actual, threshold) {
  if (actual > threshold) {
    log(colors.red, `❌ ${name}: ${actual}`);
    return false;
  } else {
    log(colors.green, `✅ ${name}: ${actual}`);
    return true;
  }
}

function main() {
  // Encontrar el reporte más reciente
  // Permite pasar un archivo específico como argumento
  let reportPath;
  
  if (process.argv.length > 2) {
    reportPath = path.resolve(process.argv[2]);
  } else {
    const files = fs.readdirSync(DOCS_DIR)
      .filter(f => f.startsWith('SECURITY_PIPELINE_') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));

    if (files.length === 0) {
      log(colors.red, '❌ No se encontró ningún reporte JSON en ' + DOCS_DIR);
      log(colors.white, '\nPrimero ejecuta la auditoría:');
      log(colors.white, '  npm run security:audit');
      process.exit(1);
    }

    reportPath = path.join(DOCS_DIR, files[0]);
  }
  
  log(colors.cyan, `🔍 Validando reporte: ${reportPath}`);
  console.log('');

  let report;
  try {
    const content = fs.readFileSync(reportPath, 'utf8');
    report = JSON.parse(content);
  } catch (error) {
    log(colors.red, `❌ Error al leer el reporte: ${error.message}`);
    process.exit(1);
  }

  let failCount = 0;
  const results = [];

  // ===========================================
  // ERRORES DE TIPO (CRÍTICO)
  // ===========================================
  const typeErrors = report.errors?.typeErrors || 0;
  results.push(checkMetric('Errores de tipo', typeErrors, THRESHOLDS.typeErrors));

  // ===========================================
  // ANY TYPES
  // ===========================================
  const anyTypes = report.errors?.anyTypes || 0;
  results.push(checkMetric('Tipos \'any\'', anyTypes, THRESHOLDS.anyTypes));

  // ===========================================
  // CONSOLE.LOG
  // ===========================================
  const consoleLogs = report.errors?.consoleLogs || 0;
  results.push(checkMetric('console.log', consoleLogs, THRESHOLDS.consoleLogs));

  // ===========================================
  // SELECT(*) QUERIES
  // ===========================================
  const selectStar = report.errors?.selectStarQueries || 0;
  results.push(checkMetric('select(*) queries', selectStar, THRESHOLDS.selectStarQueries));

  // ===========================================
  // MISSING RLS
  // ===========================================
  const missingRls = report.errors?.missingRls || 0;
  results.push(checkMetric('Missing RLS', missingRls, THRESHOLDS.missingRls));

  // ===========================================
  // VULNERABILIDADES CRÍTICAS
  // ===========================================
  const vulnCritical = report.dependencies?.critical || 0;
  results.push(checkMetric('Vulnerabilidades críticas', vulnCritical, THRESHOLDS.dependenciesCritical));

  // ===========================================
  // VULNERABILIDADES ALTAS
  // ===========================================
  const vulnHigh = report.dependencies?.high || 0;
  results.push(checkMetric('Vulnerabilidades altas', vulnHigh, THRESHOLDS.dependenciesHigh));

  // ===========================================
  // TESTS FALLIDOS
  // ===========================================
  const testsFailed = report.tests?.failed || 0;
  results.push(checkMetric('Tests fallidos', testsFailed, THRESHOLDS.testsFailed));

  // ===========================================
  // RESUMEN FINAL
  // ===========================================
  console.log('');
  failCount = results.filter(r => !r).length;

  if (failCount > 0) {
    log(colors.white, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.red, '❌ AUDITORÍA RECHAZADA');
    log(colors.white, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.white, `Hallazgos críticos: ${failCount}`);
    console.log('');
    log(colors.cyan, '📊 Métricas completas:');
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  } else {
    log(colors.white, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.green, '✅ AUDITORÍA APROBADA');
    log(colors.white, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    log(colors.cyan, '📊 Resumen:');
    console.log(JSON.stringify({
      status: report.status,
      tests: report.tests,
      dependencies: {
        total: report.dependencies?.total || 0,
        critical: report.dependencies?.critical || 0,
        high: report.dependencies?.high || 0
      }
    }, null, 2));
  }
}

main();

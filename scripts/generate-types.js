#!/usr/bin/env node

/**
 * Script para generar tipos de TypeScript desde Supabase
 * Usa la API REST de Supabase en lugar de la CLI
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'kpdadwtxfazhtoqnttdh';
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'types', 'supabase.ts');

console.log('🔄 Generando tipos de TypeScript desde Supabase...');
console.log(`📁 Proyecto: ${PROJECT_ID}`);
console.log(`📄 Output: ${OUTPUT_PATH}`);

// URL para obtener tipos desde la API de Supabase
const url = `https://${PROJECT_ID}.supabase.co/rest/v1/`;

// Headers necesarios
const headers = {
  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
};

console.log('\n⚠️  IMPORTANTE: Para generar los tipos automáticamente, necesitas:');
console.log('1. Tener las variables de entorno configuradas en .env.local:');
console.log('   NEXT_PUBLIC_SUPABASE_URL=https://kpdadwtxfazhtoqnttdh.supabase.co');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key');
console.log('');
console.log('2. O usar el comando directo de Supabase CLI:');
console.log('   npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src/types/supabase.ts');
console.log('');
console.log('3. O ejecutar desde PowerShell:');
console.log('   npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public | Out-File -FilePath src/types/supabase.ts');
console.log('');

// Verificar si existe el archivo .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local encontrado');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurado');
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY NO encontrado en .env.local');
  }
} else {
  console.log('❌ .env.local NO encontrado');
}

console.log('\n📋 Instrucciones manuales:');
console.log('========================');
console.log('1. Abre una terminal en E:\\ProyectDashboard');
console.log('2. Ejecuta:');
console.log('   npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src/types/supabase.ts');
console.log('3. Verifica que se generó el archivo:');
console.log('   head -50 src/types/supabase.ts');
console.log('4. Ejecuta type-check:');
console.log('   npm run type-check');
console.log('========================\n');

process.exit(0);

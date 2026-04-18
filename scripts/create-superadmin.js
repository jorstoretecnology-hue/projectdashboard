// scripts/create-superadmin.js
// SOLO ejecutar desde el servidor con acceso a .env.local
// Uso: npm run create-superadmin -- email@dominio.com MiPassword123!

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import readline from 'readline';

// ── VALIDACIONES DE ENTORNO ──────────────────────────────────────────────────

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPERADMIN_CREATION_SECRET' // llave secreta adicional
]

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Variable de entorno faltante: ${key}`)
    console.error('   Este script solo puede ejecutarse con acceso completo al servidor.')
    process.exit(1)
  }
}

// ── VALIDACIONES DE PASSWORD ─────────────────────────────────────────────────

function validatePassword(password) {
  const errors = []
  if (password.length < 12) errors.push('Mínimo 12 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula')
  if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula')
  if (!/[0-9]/.test(password)) errors.push('Al menos un número')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Al menos un carácter especial (!@#$...)')
  if (/password|123456|admin|superadmin/i.test(password)) errors.push('Password demasiado común')
  return errors
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── CONFIRMACIÓN INTERACTIVA ─────────────────────────────────────────────────

function confirm(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'si' || answer.toLowerCase() === 'sí')
    })
  })
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function createSuperAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  const secret = process.argv[4]

  // 1. Verificar argumentos
  if (!email || !password || !secret) {
    console.error('\n❌ Uso: npm run create-superadmin -- email password SECRET_KEY')
    console.error('   SECRET_KEY debe coincidir con SUPERADMIN_CREATION_SECRET en .env.local\n')
    process.exit(1)
  }

  // 2. Verificar secret (previene ejecución accidental o por atacante sin .env)
  const expectedSecret = process.env.SUPERADMIN_CREATION_SECRET
  const secretValid = crypto.timingSafeEqual(
    Buffer.from(secret.padEnd(64)),
    Buffer.from(expectedSecret.padEnd(64))
  )
  if (!secretValid) {
    console.error('❌ SECRET_KEY incorrecto. Acceso denegado.')
    // Delay para dificultar fuerza bruta
    await new Promise(r => setTimeout(r, 2000))
    process.exit(1)
  }

  // 3. Validar email
  if (!validateEmail(email)) {
    console.error('❌ Email inválido.')
    process.exit(1)
  }

  // 4. Validar password
  const passwordErrors = validatePassword(password)
  if (passwordErrors.length > 0) {
    console.error('❌ Password no cumple los requisitos de seguridad:')
    passwordErrors.forEach(e => console.error(`   • ${e}`))
    process.exit(1)
  }

  // 5. Verificar que no exista superadmin previo (ignorar los borrados lógicamente)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('app_role', 'SUPER_ADMIN')
    .is('deleted_at', null)

  if (count > 0) {
    console.error(`❌ Ya existe ${count} SUPER_ADMIN en el sistema.`)
    console.error('   Por seguridad, no se permite crear otro desde este script.')
    console.error('   Usa el SQL Editor de Supabase con acceso directo a la DB.')
    process.exit(1)
  }

  // 6. Confirmación humana explícita
  console.log('\n⚠️  ATENCIÓN: Estás a punto de crear el SuperAdmin del sistema.')
  console.log(`   Email:   ${email}`)
  console.log(`   Entorno: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log('\n   Este usuario tendrá acceso total a TODOS los tenants.')
  const ok = await confirm('\n¿Confirmas? Escribe "si" para continuar: ')

  if (!ok) {
    console.log('\n🚫 Operación cancelada.\n')
    process.exit(0)
  }

  // 7. Crear usuario
  console.log('\n🔧 Creando SuperAdmin...')

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      app_role: 'SUPER_ADMIN',
      tenant_id: null,
      created_by: 'cli',
      created_at: new Date().toISOString()
    }
  })

  if (authError) {
    console.error('❌ Error en Auth:', authError.message)
    process.exit(1)
  }

  const userId = authData.user.id

  // 8. Crear perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: 'Super Admin',
      app_role: 'SUPER_ADMIN',
      tenant_id: null
    })

  if (profileError) {
    console.error('❌ Error al crear perfil:', profileError.message)
    // Rollback: eliminar el usuario de auth para no dejar inconsistencia
    await supabase.auth.admin.deleteUser(userId)
    console.error('   Se hizo rollback del usuario en Auth.')
    process.exit(1)
  }

  // 9. Registrar en audit_logs
  try {
    const { error: auditError } = await supabase.from('audit_logs').insert({
      tenant_id: null,
      user_id: userId,
      action: 'SUPERADMIN_CREATED',
      entity_type: 'profiles',
      entity_id: userId,
      new_data: { email, app_role: 'SUPER_ADMIN', created_by: 'cli' },
      ip_address: 'localhost'
    })
    
    if (auditError) {
      console.warn('⚠️  Nota: No se pudo registrar el log de auditoría:', auditError.message)
    }
  } catch (e) {
    // No bloquear si audit falla
  }

  console.log('\n✅ SuperAdmin creado exitosamente:')
  console.log(`   Email:  ${email}`)
  console.log(`   ID:     ${userId}`)
  console.log(`   Rol:    SUPER_ADMIN`)
  console.log('\n👉 Inicia sesión en /auth/login')
  console.log('   Serás redirigido automáticamente a /superadmin/dashboard\n')
}

createSuperAdmin().catch(err => {
  console.error('❌ Error inesperado:', err.message)
  process.exit(1)
})

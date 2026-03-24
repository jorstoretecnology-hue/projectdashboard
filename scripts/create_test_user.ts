import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  const email = `test_onboarding_${Date.now()}@example.com`
  const password = 'TestPassword123!'

  console.log(`Intentando crear usuario: ${email}`)

  // 1. Crear usuario con el cliente de admin (bypasses confirmation)
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Tester Onboarding' }
  })

  if (createError) {
    console.error('Error al crear usuario:', createError.message)
    process.exit(1)
  }

  console.log('Usuario creado exitosamente:', user.user?.id)
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  
  // Imprimir para que el agente lo lea
  console.log('--- DATA FOR AGENT ---')
  console.log(`USER_EMAIL=${email}`)
  console.log(`USER_PASSWORD=${password}`)
  console.log('-----------------------')
}

createTestUser()

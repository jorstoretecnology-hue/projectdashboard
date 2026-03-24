const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  const email = `test_onboarding_${Date.now()}@example.com`
  const password = 'TestPassword123!'

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Tester Onboarding' }
  })

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('--- DATA FOR AGENT ---')
  console.log(`USER_EMAIL=${email}`)
  console.log(`USER_PASSWORD=${password}`)
  console.log('-----------------------')
}

createTestUser()

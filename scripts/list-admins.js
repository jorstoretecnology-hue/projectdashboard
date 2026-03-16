require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function listAdmins() {
  console.log('--- SuperAdmins in profiles table ---')
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, email, app_role')
    .eq('app_role', 'SUPER_ADMIN')
  
  if (pError) console.error(pError)
  else console.log(profiles)
}

listAdmins()

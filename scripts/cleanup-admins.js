require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sqlCleanup() {
  console.log('Running SQL cleanup on profiles table...')
  
  // Usar query de postgres directa para evitar problemas de RLS/API
  const { data, error } = await supabase.rpc('execute_sql_internal', {
    sql_query: "DELETE FROM public.profiles WHERE app_role = 'SUPER_ADMIN';"
  })
  
  // Si no tenemos la función rpc execute_sql_internal, intentamos delete normal de nuevo pero con log de error detallado
  if (error) {
    console.warn('RPC failed (probably does not exist), falling back to standard delete...')
    const { data: dData, error: dError, count } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .filter('app_role', 'eq', 'SUPER_ADMIN')
    
    if (dError) {
      console.error('❌ Delete Error:', dError)
    } else {
      console.log('✅ Standard delete result count:', count)
    }
  } else {
    console.log('✅ SQL delete successful')
  }
}

sqlCleanup()

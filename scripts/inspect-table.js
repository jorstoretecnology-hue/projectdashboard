require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectTable() {
  console.log('Inspecting profiles table triggers and constraints...')
  
  // Script para ver triggers y constraints
  const query = `
    SELECT 
        trigger_name, 
        event_manipulation, 
        action_statement 
    FROM information_schema.triggers 
    WHERE event_object_table = 'profiles';
  `;
  
  const { data, error } = await supabase.rpc('execute_sql_internal', { sql_query: query });
  
  if (error) {
    console.warn('RPC execute_sql_internal missing. Using standard select on information_schema (might fail if RLS/Permissions block)...')
    // A falta de RPC, intentaremos obtener info via API pero information_schema no suele estar expuesta en PostgREST
  }
  
  console.log('Current SuperAdmin in profiles (Diagnostic):')
  const { data: admin } = await supabase.from('profiles').select('*').eq('app_role', 'SUPER_ADMIN')
  console.log(admin)
}

inspectTable()

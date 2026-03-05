const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.from('tenants').select('id').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Intentar listar tablas vía RPC o viendo que falla
  console.log('Buscando tablas...');
  const tables = ['sales', 'services', 'service_orders', 'customers', 'profiles', 'tenants', 'vehicles'];
  for (const t of tables) {
    const { error: e } = await supabase.from(t).select('count', { count: 'exact', head: true });
    console.log(`Table ${t}: ${e ? 'ERROR: ' + e.message : 'OK'}`);
  }
}

test();

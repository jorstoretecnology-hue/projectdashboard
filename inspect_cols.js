const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'sales' });
  if (error) {
     // Si RPC no existe, usar informaton_schema vía query (si el usuario tiene permisos, service_role debería)
     // Pero Supabase REST no permite queries arbitrarias. 
     // Intentemos obtener un registro y ver sus llaves.
     const { data: cols, error: err2 } = await supabase.from('sales').select('*').limit(1);
     if (err2) {
        console.error('ERROR_GETTING_COLS:', err2);
     } else if (cols && cols.length > 0) {
        console.log('COLUMNS:', Object.keys(cols[0]));
     } else {
        console.log('NO_RECORDS_TO_INSPECT');
     }
  } else {
    console.log('COLUMNS_RPC:', data);
  }
}

test();

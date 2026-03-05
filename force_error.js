const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { error: e1 } = await supabase.from('sales').select('non_existent_column_123');
  console.log('SALES_HINT:', e1?.message);
  
  const { error: e2 } = await supabase.from('services').select('non_existent_column_123');
  console.log('SERVICES_HINT:', e2?.message);
  
  const { error: e3 } = await supabase.from('customers').select('non_existent_column_123');
  console.log('CUSTOMERS_HINT:', e3?.message);
}

test();

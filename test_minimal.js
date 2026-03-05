const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').eq('name', 'Agencia Demo Pro').limit(1);
    const tenantId = tenants?.[0]?.id;
    if (!tenantId) {
      console.log('TENANT_NOT_FOUND');
      return;
    }

    const { data: customer } = await supabase.from('customers').insert({
      tenant_id: tenantId,
      first_name: 'Juan',
      last_name: 'QA',
      email: 'juan.qa@example.com'
    }).select('id').single();

    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      tenant_id: tenantId,
      customer_id: customer.id,
      state: 'PENDIENTE',
      total: 100,
      subtotal: 100
    }).select('id').single();

    if (saleError) throw saleError;

    console.log('SUCCESS_ID:' + sale.id);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();

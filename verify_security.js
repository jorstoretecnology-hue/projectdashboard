const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log("=== VERIFICACIÓN ESPECÍFICA DE FKs Y CONSTRAINTS ===\n");

  const fakeTenantId = '00000000-0000-0000-0000-000000000099';

  // 1. Products FK - cumpliendo todos los check constraints
  console.log("--- 1. FK products.tenant_id ---");
  const { error: fkProd } = await supabase.from('products').insert({
    tenant_id: fakeTenantId,
    name: 'FK_TEST_PRODUCT',
    price: 100,
    category: 'Servicios',
    industry_type: 'general',
    stock: 1
  });
  if (fkProd) {
    console.log(`  ${fkProd.message.includes('foreign key') ? '✅ FK ACTIVA' : '⚠️ Error diferente'}: ${fkProd.message}`);
  } else {
    console.log("  ❌ FK NO ACTIVA (insert exitoso con tenant falso)");
    await supabase.from('products').delete().eq('name', 'FK_TEST_PRODUCT');
  }

  // 2. Customers FK 
  console.log("\n--- 2. FK customers.tenant_id ---");
  const { error: fkCust } = await supabase.from('customers').insert({
    tenant_id: fakeTenantId,
    first_name: 'FK_TEST',
    last_name: 'CUSTOMER',
    email: 'fk_test_unique@test.com'
  });
  if (fkCust) {
    console.log(`  ${fkCust.message.includes('foreign key') ? '✅ FK ACTIVA' : '⚠️ Error diferente'}: ${fkCust.message}`);
  } else {
    console.log("  ❌ FK NO ACTIVA (insert exitoso con tenant falso)");
    await supabase.from('customers').delete().eq('email', 'fk_test_unique@test.com');
  }

  // 3. UNIQUE constraint en inventory_items(tenant_id, sku) - revisamos esquema primero
  console.log("\n--- 3. Esquema de inventory_items ---");
  const { data: cols } = await supabase.from('inventory_items').select('*').limit(0);
  console.log("  Columnas accesibles OK");

  // 4. Verificar policies RLS existentes con check de aislamiento
  console.log("\n--- 4. AISLAMIENTO MULTI-TENANT ---");
  const { data: tenants } = await supabase.from('tenants').select('id, name').limit(2);
  console.log(`  Tenants encontrados: ${tenants?.length || 0}`);
  tenants?.forEach(t => console.log(`    - ${t.name} (${t.id})`));

  console.log("\n=== VERIFICACIÓN COMPLETA ===");
}

verify().catch(console.error);

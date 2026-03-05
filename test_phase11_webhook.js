const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan variables de entorno en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('🚀 Iniciando prueba de venta para Fase 11...');

  try {
    // 1. Obtener datos necesarios
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const { data: customers } = await supabase.from('customers').select('id').limit(1);
    const { data: products } = await supabase.from('products').select('id, price').limit(1);

    if (!tenants?.[0] || !customers?.[0] || !products?.[0]) {
      throw new Error('No se encontraron datos (tenant, cliente o producto) para realizar la prueba.');
    }

    const tenantId = tenants[0].id;
    const customerId = customers[0].id;
    const product = products[0];

    console.log(`✅ Datos cargados: Tenant(${tenantId}), Cliente(${customerId}), Producto(${product.id})`);

    // 2. Simular Venta vía RPC (para activar todo el flujo de base de datos)
    const saleData = {
      p_tenant_id: tenantId,
      p_user_id: '791b9026-c1be-4d25-9ad2-4199685a0275', // ID del usuario John Ortiz
      p_customer_id: customerId,
      p_payment_method: 'CASH',
      p_discount: 0,
      p_tax_rate: 0.19,
      p_notes: 'Venta de prueba Fase 11',
      p_items: [
        {
          product_id: product.id,
          quantity: 1,
          unit_price: product.price,
          notes: 'Mesa 5 - Prueba Automatización'
        }
      ],
      p_metadata: { mesa: "5", zona: "Terraza", ambiente: "Prueba Robot" }
    };

    console.log('📡 Llamando a create_sale_transaction...');
    const { data: result, error } = await supabase.rpc('create_sale_transaction', saleData);

    if (error) throw error;

    console.log('✨ Venta creada exitosamente:', result);
    console.log('\n🔔 REVISA TU N8N: El payload con "mesa: 5" debería estar llegando ahora mismo.');
    
  } catch (err) {
    console.error('❌ Error en la prueba:', err.message);
  }
}

runTest();

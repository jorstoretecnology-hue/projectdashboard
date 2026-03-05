const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  try {
    // 1. Obtener ID de Agencia Demo Pro
    const { data: tenants } = await supabase.from('tenants').select('id').eq('name', 'Agencia Demo Pro').limit(1);
    const tenantId = tenants?.[0]?.id;
    if (!tenantId) {
      console.log('TENANT_NOT_FOUND');
      return;
    }

    // 2. Obtener un usuario para created_by
    const { data: profiles } = await supabase.from('profiles').select('id').eq('tenant_id', tenantId).limit(1);
    const userId = profiles?.[0]?.id;
    if (!userId) {
       console.log('USER_NOT_FOUND_FOR_TENANT');
       return;
    }

    // 3. Obtener o Crear Producto
    let { data: product } = await supabase.from('products').select('id, name, price, sku').eq('tenant_id', tenantId).limit(1).single();
    if (!product) {
       const { data: newProd, error: prodError } = await supabase.from('products').insert({
         tenant_id: tenantId,
         name: 'Servicio de Mantenimiento',
         price: 150000,
         category: 'Servicios',
         industry_type: 'taller',
         stock: 100
       }).select('id, name, price, sku').single();
       if (prodError) throw prodError;
       product = newProd;
    }

    // 4. Crear Cliente de Prueba
    const { data: customer, error: custError } = await supabase.from('customers').insert({
      tenant_id: tenantId,
      first_name: 'Juan',
      last_name: 'Prueba RPC',
      email: `juan.rpc.${Date.now()}@example.com`
    }).select('id').single();

    if (custError) throw custError;

    // 5. Invocación RPC (checklist como objeto clave-valor)
    const { data: result, error: rpcError } = await supabase.rpc('create_sale_transaction', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_customer_id: customer.id,
      p_payment_method: 'EFECTIVO',
      p_discount: 0,
      p_tax_rate: 0,
      p_notes: 'Orden de prueba para tracking de taller',
      p_items: [
        {
          product_id: product.id,
          quantity: 1,
          unit_price: product.price,
          notes: 'Revisión técnica completa'
        }
      ],
      p_metadata: {
        industry: 'taller',
        inspection_photos: [
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1530046339160-ce3e5b0c7a2f?auto=format&fit=crop&q=80&w=800'
        ],
        checklist: {
          "Frenos": "BIEN",
          "Aceite": "BAJO",
          "Llantas": "BIEN"
        }
      }
    });

    if (rpcError) throw rpcError;

    console.log('SALE_ID:', JSON.stringify(result));
  } catch (err) {
    console.error('CRITICAL_ERROR:', JSON.stringify(err, null, 2));
  }
}

test();

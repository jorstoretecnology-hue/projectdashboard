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

    // 4. Crear Cliente de Prueba (Sin metadata)
    const { data: customer, error: custError } = await supabase.from('customers').insert({
      tenant_id: tenantId,
      first_name: 'Juan',
      last_name: 'Prueba',
      email: 'juan.prueba@example.com'
    }).select('id').single();

    if (custError) throw custError;

    // 5. Crear Venta de Prueba
    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      tenant_id: tenantId,
      customer_id: customer.id,
      created_by: userId,
      state: 'PENDIENTE',
      total: product.price,
      subtotal: product.price,
      metadata: {
        industry: 'taller',
        inspection_photos: [
          'https://placehold.co/600x400/000000/FFFFFF/png?text=Foto+Frontal',
          'https://placehold.co/600x400/000000/FFFFFF/png?text=Foto+Lateral'
        ],
        inspection_checklist: ['Luces OK', 'Nivel Aceite Bajo', 'Sin rayones visibles']
      }
    }).select('id').single();

    if (saleError) throw saleError;

    // 6. Crear Sale Item
    const { error: itemError } = await supabase.from('sale_items').insert({
      sale_id: sale.id,
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      unit_price: product.price,
      quantity: 1,
      subtotal: product.price
    });

    if (itemError) throw itemError;

    console.log('SUCCESS_SALE_ID:' + sale.id);
  } catch (err) {
    console.error('CRITICAL_ERROR:', JSON.stringify(err, null, 2));
  }
}

test();

// Script para ejecutar la reparación de tenant_id usando Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairTenantId() {
  console.log('🔧 Iniciando reparación de tenant_id...\n');

  try {
    // PASO 1: Crear tenant
    console.log('PASO 1: Creando tenant...');
    const { data: existingTenant, error: checkError } = await supabase
      .from('tenants')
      .select('id, name, plan')
      .eq('name', 'Mi Organización')
      .single();

    let tenantId;
    if (existingTenant) {
      console.log('✅ Tenant ya existe:', existingTenant.id);
      tenantId = existingTenant.id;
    } else {
      const { data: newTenant, error: createError } = await supabase
        .from('tenants')
        .insert({
          name: 'Mi Organización',
          plan: 'professional',
          industry_type: 'taller'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creando tenant:', createError.message);
        return;
      }
      console.log('✅ Tenant creado:', newTenant.id);
      tenantId = newTenant.id;
    }

    // PASO 2: Actualizar perfil
    console.log('\nPASO 2: Actualizando profile...');
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ tenant_id: tenantId })
      .eq('id', user.user.id);

    if (profileError) {
      console.error('❌ Error actualizando profile:', profileError.message);
    } else {
      console.log('✅ Profile actualizado con tenant_id');
    }

    // PASO 3: Verificación
    console.log('\nPASO 3: Verificando...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.user.id)
      .single();

    if (profile && profile.tenant_id) {
      console.log('✅ REPARACIÓN EXITOSA');
      console.log('   User ID:', user.user.id);
      console.log('   Email:', user.user.email);
      console.log('   Tenant ID:', profile.tenant_id);
    } else {
      console.log('❌ Falla en verificación');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

repairTenantId();

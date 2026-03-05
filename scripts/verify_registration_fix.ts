
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateRegistration() {
  console.log('🧪 Starting Registration Simulation...');

  // 1. Create a Fake User ID (simulating auth.users entry)
  // We can't easily insert into auth.users directly via client without admin API, 
  // but we can test the RPC 'initialize_new_organization' which is the core logic.
  // Actually, let's create a real user using Admin API to trigger the trigger!
  
  const uniqueEmail = `test_user_qa_${Date.now()}@example.com`;
  const uniquePass = 'password123';

  console.log(`   Creating Auth User: ${uniqueEmail}`);
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: uniqueEmail,
    password: uniquePass,
    email_confirm: true,
    user_metadata: { full_name: 'Test QA User' }
  });

  if (createError || !user) {
    console.error('❌ Failed to create auth user:', createError);
    return;
  }
  console.log(`   ✅ User Created: ${user.id}`);

  // 2. Verify Trigger Execution (Profile should exist now)
  console.log('   Verifying Automated Profile Creation (Trigger)...');
  // Wait a bit for trigger
  await new Promise(r => setTimeout(r, 1000));

  const { data: profileMs } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profileMs) {
    console.error('   ❌ Trigger Failed: Profile was NOT created automatically.');
  } else {
    console.log('   ✅ Trigger Passed: Profile found:', profileMs);
  }

  // 3. Run RPC to Initialize Organization
  console.log('   Running initialize_new_organization RPC...');
  const { data: tenantId, error: rpcError } = await supabase.rpc('initialize_new_organization', {
    p_name: 'QA Test Workshop',
    p_plan: 'free',
    p_industry: 'taller',
    p_user_id: user.id,
    p_modules: ['Dashboard', 'Settings']
  });

  if (rpcError) {
    console.error('   ❌ RPC Failed:', rpcError);
    // Clean up
    await supabase.auth.admin.deleteUser(user.id);
    return;
  }
  console.log(`   ✅ RPC Success. Tenant ID: ${tenantId}`);

  // 4. Verify Final State
  console.log('   Verifying Final State (Profile + Metadata)...');
  
  // Check Profile Link
  const { data: finalProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const passedProfile = finalProfile.tenant_id === tenantId && finalProfile.app_role === 'ADMIN';
  console.log(`   - Profile Linked: ${passedProfile ? '✅' : '❌'} (${finalProfile.tenant_id})`);

  // Check Auth Metadata (Need to fetch user again)
  const { data: { user: updatedUser } } = await supabase.auth.admin.getUserById(user.id);
  const metadata = updatedUser?.app_metadata || {};
  const passedMeta = metadata.tenant_id === tenantId && metadata.app_role === 'ADMIN';
  
  console.log(`   - Auth Metadata Sync: ${passedMeta ? '✅' : '❌'}`, metadata);

  // 5. Cleanup
  console.log('   🧹 Cleaning up test data...');
  await supabase.auth.admin.deleteUser(user.id);
  // Optional: Delete tenant if needed, but cascading might not be set up on auth delete for tenant
  if (tenantId) {
     await supabase.from('tenants').delete().eq('id', tenantId);
  }
  
  console.log('✨ Simulation Complete.');
}

simulateRegistration();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToSuperAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'superadmin' })
    .eq('email', 'sa_demo4@example.com');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success: User sa_demo4@example.com promoted to superadmin.');
  }
}

promoteToSuperAdmin();

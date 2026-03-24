const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuery() {
  console.log("Testing tenants query...");
  const tenantsRes = await supabase.from("tenants").select("id, name, plan, industry_type, active_modules, branding, is_active, max_users, created_at, updated_at, custom_domain, tenant_modules(module_slug)").limit(1);
  if (tenantsRes.error) console.error("Tenants Error:", tenantsRes.error);
  else console.log("Tenants Success:", tenantsRes.data.length);
}

testQuery();
